
'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// import { Switch } from '@/components/ui/switch'
// import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, InfoIcon, PlusIcon, TrashIcon, LoaderIcon } from 'lucide-react'
import { getNotificationConfigs, updateNotificationConfig } from '@/app/actions/notification-settings'
import { toast } from 'sonner' // Ensure you have this or use your toast utility

interface Config {
    event: string
    emails: string[]
    isActive: boolean
}

export function NotificationSettings() {
    const [configs, setConfigs] = useState<Config[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Helper to add email to a specific event
    const [newEmail, setNewEmail] = useState<Record<string, string>>({})

    useEffect(() => {
        loadConfigs()
    }, [])

    const loadConfigs = async () => {
        try {
            const data = await getNotificationConfigs()
            setConfigs(data)
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (event: string, updatedConfig: Partial<Config>) => {
        setSaving(true)
        try {
            // current state or default
            const current = configs.find(c => c.event === event) || { emails: [], isActive: true }

            const payload = {
                emails: updatedConfig.emails ?? current.emails,
                isActive: updatedConfig.isActive ?? current.isActive
            }

            await updateNotificationConfig(event, payload)

            // Optimistic update
            setConfigs(prev => {
                const exists = prev.find(c => c.event === event)
                if (exists) {
                    return prev.map(c => c.event === event ? { ...c, ...payload } : c)
                } else {
                    // Add new entry
                    return [...prev, { event, ...payload } as Config]
                }
            })
            toast.success("Settings saved");

        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false)
        }
    }

    const addEmail = (event: string) => {
        const email = newEmail[event]?.trim()
        if (!email) return

        const config = configs.find(c => c.event === event)
        const currentEmails = config ? config.emails : []

        if (!currentEmails.includes(email)) {
            const updatedEmails = [...currentEmails, email]
            handleSave(event, { emails: updatedEmails })
            setNewEmail(prev => ({ ...prev, [event]: '' }))
        }
    }

    const removeEmail = (event: string, emailToRemove: string) => {
        const config = configs.find(c => c.event === event)
        if (config) {
            const updatedEmails = config.emails.filter(e => e !== emailToRemove)
            handleSave(event, { emails: updatedEmails })
        }
    }

    if (loading) return <div>Loading settings...</div>

    const EVENTS = [
        { key: 'LOAN_SUBMISSION', label: 'Loan Application Submitted', desc: 'Sent to Admins when a member applies.' },
        { key: 'LOAN_APPROVAL', label: 'Loan Approved', desc: 'Sent to Member (and these CCs) when loan is active.' },
        // Add more as needed
    ]

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <Mail className="w-6 h-6" /> Email Notification Config
            </h3>

            {EVENTS.map(ev => {
                const config = configs.find(c => c.event === ev.key) || { event: ev.key, emails: [], isActive: true }

                return (
                    <Card key={ev.key}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg text-slate-800">{ev.label}</CardTitle>
                                    <CardDescription>{ev.desc}</CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor={`switch-${ev.key}`} className="text-sm">Active</Label>
                                    <input
                                        id={`switch-${ev.key}`}
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={config.isActive}
                                        onChange={(e) => handleSave(ev.key, { isActive: e.target.checked })}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {config.isActive ? (
                                <>
                                    <div className="space-y-2">
                                        {config.emails.map(email => (
                                            <div key={email} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                                                <span className="text-sm font-medium">{email}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeEmail(ev.key, email)}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {config.emails.length === 0 && (
                                            <p className="text-sm text-slate-400 italic">No recipients configured.</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add recipient email..."
                                            value={newEmail[ev.key] || ''}
                                            onChange={e => setNewEmail(prev => ({ ...prev, [ev.key]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && addEmail(ev.key)}
                                        />
                                        <Button size="sm" onClick={() => addEmail(ev.key)}>
                                            <PlusIcon className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-slate-100 border-l-4 border-slate-400 p-4 flex gap-2 rounded-r">
                                    <InfoIcon className="w-4 h-4 text-slate-500 mt-0.5" />
                                    <p className="text-sm text-slate-700">Notifications for this event are disabled.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
