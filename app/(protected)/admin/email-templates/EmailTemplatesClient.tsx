'use client'

import React, { useState } from 'react'
import { updateEmailTemplate, toggleEmailTemplate, previewEmailTemplate } from '@/app/actions/email-template-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Edit2, Eye, Mail, Info } from 'lucide-react'
import { format } from 'date-fns'
import { EmailTemplate } from '@prisma/client'

interface Props {
    initialTemplates: EmailTemplate[]
}

const AVAILABLE_VARIABLES = [
    '{{applicant_name}}', '{{loan_id}}', '{{loan_amount}}',
    '{{loan_term}}', '{{interest_rate}}', '{{approval_link}}',
    '{{disbursement_date}}', '{{repayment_summary}}', '{{next_steps}}'
]

export default function EmailTemplatesClient({ initialTemplates }: Props) {
    const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates)
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
    const [previewData, setPreviewData] = useState<{ subject: string, html: string } | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    const startEditing = (t: EmailTemplate) => {
        setEditingTemplate(t)
        setName(t.name)
        setSubject(t.subject)
        setBody(t.body)
        setPreviewData(null)
    }

    const handleToggle = async (t: EmailTemplate) => {
        try {
            const res = await toggleEmailTemplate(t.id, !t.isActive)
            if (res.success) {
                setTemplates(prev => prev.map(tmpl => tmpl.id === t.id ? { ...tmpl, isActive: !t.isActive } : tmpl))
                toast.success(`Template ${!t.isActive ? 'enabled' : 'disabled'} successfully.`)
            }
        } catch (error) {
            toast.error('Failed to toggle template status.')
        }
    }

    const handleSave = async () => {
        if (!editingTemplate) return
        setIsSaving(true)
        try {
            const res = await updateEmailTemplate(editingTemplate.id, name, subject, body)
            if (res.success) {
                setTemplates(prev => prev.map(tmpl => tmpl.id === editingTemplate.id ? res.template : tmpl))
                setEditingTemplate(null)
                toast.success('Template saved successfully.')
            }
        } catch (error) {
            toast.error('Failed to save template.')
        } finally {
            setIsSaving(false)
        }
    }

    const handlePreview = async (t: EmailTemplate) => {
        try {
            // If we are previewing the one currently being edited, use the form state. Otherwise use the DB state.
            const s = editingTemplate?.id === t.id ? subject : t.subject
            const b = editingTemplate?.id === t.id ? body : t.body

            const res = await previewEmailTemplate(t.type, b, s)
            if (res.success) {
                setPreviewData({ subject: res.subject, html: res.html })
            }
        } catch (error) {
            toast.error('Failed to generate preview.')
        }
    }

    const insertVariable = (variable: string) => {
        setBody(prev => prev + ' ' + variable)
    }

    if (previewData) {
        return (
            <Card className="max-w-3xl mx-auto border-blue-100 shadow-md">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                <Eye className="h-5 w-5" />
                                Template Preview
                            </CardTitle>
                            <CardDescription className="text-blue-700/70 mt-1">
                                Preview with sample data — not a live email
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setPreviewData(null)}>Close Preview</Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="bg-slate-50 p-4 rounded-md border text-sm mb-6 shadow-sm">
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                            <span className="text-slate-500 font-medium">To:</span>
                            <span className="text-slate-900">member@example.com</span>
                            <span className="text-slate-500 font-medium">Subject:</span>
                            <span className="font-semibold text-slate-900">{previewData.subject}</span>
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none p-6 border rounded-lg bg-white shadow-sm min-h-[300px]">
                        <div dangerouslySetInnerHTML={{ __html: previewData.html }} />

                        {(editingTemplate?.type === 'LOAN_APPROVAL_REQUEST') && (
                            <div className="mt-8 pt-4 border-t flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded">
                                <Mail className="h-5 w-5 text-blue-500" />
                                <span className="text-sm italic">
                                    A PDF copy of the Loan Card layout will be permanently attached to this email.
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (editingTemplate) {
        return (
            <Card className="max-w-4xl border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 pb-4 border-b">
                    <CardTitle className="text-xl">Editing Template: <span className="text-blue-600">{editingTemplate.name}</span></CardTitle>
                    <CardDescription>Use variables to inject dynamic loan data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label>Internal Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Email Subject</Label>
                        <Input value={subject} onChange={e => setSubject(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <Label>Email Body</Label>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Info className="h-3 w-3" /> Plain text format. Line breaks are converted to HTML automatically.
                            </span>
                        </div>
                        <Textarea
                            className="min-h-[300px] font-mono text-sm leading-relaxed"
                            value={body}
                            onChange={e => setBody(e.target.value)}
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">Available Variables</Label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_VARIABLES.map(v => (
                                <Badge
                                    key={v}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors py-1 px-2"
                                    onClick={() => insertVariable(v)}
                                >
                                    {v}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <Button variant="ghost" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handlePreview(editingTemplate)}>
                                <Eye className="w-4 h-4 mr-2" /> Preview
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(t => (
                <Card key={t.id} className={`transition-all ${!t.isActive ? 'opacity-60 bg-slate-50 grayscale-[0.2]' : 'hover:shadow-md border-blue-100/50'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg line-clamp-1" title={t.name}>{t.name}</CardTitle>
                            <Switch
                                checked={t.isActive}
                                onCheckedChange={() => handleToggle(t)}
                                title={t.isActive ? "Disable Template" : "Enable Template"}
                            />
                        </div>
                        <CardDescription className="text-xs font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded text-slate-600 mt-1">
                            {t.type}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-slate-500 mb-4 line-clamp-2">
                            <span className="font-medium text-slate-700">Subject:</span> {t.subject}
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400 border-t pt-3 mt-auto">
                            <span>Updated {format(new Date(t.updatedAt), 'MMM d, yyyy')}</span>
                            <div className="flex gap-1 border border-slate-200 rounded-md p-0.5 bg-white">
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50" onClick={() => handlePreview(t)} title="Preview">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50" onClick={() => startEditing(t)} title="Edit">
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {templates.length === 0 && (
                <div className="col-span-full p-8 text-center bg-slate-50 border border-dashed rounded-lg text-slate-500">
                    No email templates found. Run the database seeder to install default templates.
                </div>
            )}
        </div>
    )
}
