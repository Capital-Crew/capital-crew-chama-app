'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createWelfareType, updateWelfareType, deleteWelfareType, addCustomField, updateCustomField, deleteCustomField } from '@/app/welfare-types-actions'
import { useFormAction } from '@/hooks/useFormAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'

type WelfareType = any // Ideally import type from Prisma or actions
type Account = any

interface WelfareTypeManagerProps {
    welfareTypes: WelfareType[]
    accounts: Account[] // Filtered for expenses ideally
}

export function WelfareTypeManager({ welfareTypes, accounts }: WelfareTypeManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingType, setEditingType] = useState<WelfareType | null>(null)
    const { isPending: isLoading, error, execute } = useFormAction()

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        glAccountId: '',
        isActive: true
    })

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            glAccountId: '',
            isActive: true
        })
        setEditingType(null)
    }

    const handleEdit = (type: WelfareType) => {
        setEditingType(type)
        setFormData({
            name: type.name,
            description: type.description || '',
            glAccountId: type.glAccountId,
            isActive: type.isActive
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.glAccountId) {
            toast.error('Name and GL Account are required')
            return
        }

        await execute(async () => {
            if (editingType) {
                const res = await updateWelfareType(editingType.id, formData)
                if (res.success) {
                    toast.success('Welfare type updated')
                    setIsDialogOpen(false)
                    resetForm()
                    return { success: true }
                } else {
                    return { success: false, error: res.error || 'Failed to update' }
                }
            } else {
                const res = await createWelfareType(formData)
                if (res.success) {
                    toast.success('Welfare type created')
                    setIsDialogOpen(false)
                    resetForm()
                    return { success: true }
                } else {
                    return { success: false, error: res.error || 'Failed to create' }
                }
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this welfare type?')) return

        const res = await deleteWelfareType(id)
        if (res.success) {
            toast.success(res.message)
        } else {
            toast.error(res.error || 'Failed to delete')
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Welfare Types</CardTitle>
                    <CardDescription>Manage welfare benefits and their configurations</CardDescription>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Welfare Type
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>GL Account</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Custom Fields</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {welfareTypes.map((type) => (
                            <TableRow key={type.id}>
                                <TableCell className="font-medium">
                                    {type.name}
                                    {type.description && <div className="text-xs text-muted-foreground">{type.description}</div>}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{type.glAccount.code}</span>
                                        <span className="text-xs text-muted-foreground">{type.glAccount.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={type.isActive ? 'default' : 'secondary'}>
                                        {type.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {type.customFields?.length || 0} fields
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(type.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {welfareTypes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No welfare types found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto step-container">
                    <DialogHeader>
                        <DialogTitle>{editingType ? 'Edit Welfare Type' : 'Create Welfare Type'}</DialogTitle>
                        <DialogDescription>
                            Configure the welfare benefit details and associated GL account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Medical Support"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>GL Account (Expense)</Label>
                                    <Select
                                        value={formData.glAccountId}
                                        onValueChange={val => setFormData({ ...formData, glAccountId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>
                                                    {acc.code} - {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of this benefit..."
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                {}
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="h-4 w-4 rounded border-gray-300"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        </div>

                        {}
                        {editingType && (
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Custom Fields</h4>
                                        <p className="text-sm text-muted-foreground">Additional information to collect</p>
                                    </div>
                                    <CustomFieldCreator welfareTypeId={editingType.id} />
                                </div>

                                <div className="space-y-2">
                                    {editingType.customFields?.map((field: any) => (
                                        <div key={field.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                                <div>
                                                    <div className="font-medium text-sm flex items-center gap-2">
                                                        {field.fieldName}
                                                        {field.isRequired && <Badge variant="outline" className="text-[10px] h-4">Required</Badge>}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{field.fieldType}</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive h-8 w-8 p-0"
                                                onClick={async () => {
                                                    if (confirm('Delete field?')) {
                                                        const res = await deleteCustomField(field.id)
                                                        if (res.success) toast.success('Field deleted')
                                                        else toast.error(res.error)
                                                    }
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!editingType.customFields || editingType.customFields.length === 0) && (
                                        <div className="text-center py-4 text-sm text-muted-foreground border-dashed border rounded-lg">
                                            No custom fields defined
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {!editingType && (
                            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm">
                                You can add custom fields after creating the welfare type.
                            </div>
                        )}

                        <FormError message={error} />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <SubmitButton
                            isPending={isLoading}
                            label={editingType ? 'Update' : 'Create'}
                            pendingLabel="Saving..."
                            onClick={handleSubmit}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

function CustomFieldCreator({ welfareTypeId }: { welfareTypeId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [data, setData] = useState({
        fieldName: '',
        fieldType: 'TEXT',
        isRequired: false
    })

    const handleAdd = async () => {
        if (!data.fieldName) return

        const res = await addCustomField({
            welfareTypeId,
            fieldName: data.fieldName,
            fieldType: data.fieldType as any,
            isRequired: data.isRequired,
            displayOrder: 99 // actions should handle reordering or append to end
        })

        if (res.success) {
            toast.success('Field added')
            setIsOpen(false)
            setData({ fieldName: '', fieldType: 'TEXT', isRequired: false })
        } else {
            toast.error(res.error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">Add Field</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-slate-900">Add Custom Field</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-6 space-y-2">
                            <Label className="text-slate-700 font-semibold">Field Name</Label>
                            <Input
                                value={data.fieldName}
                                onChange={e => setData({ ...data, fieldName: e.target.value })}
                                placeholder="e.g. Hospital Name"
                                className="text-slate-900"
                            />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <Label className="text-slate-700 font-semibold">Field Type</Label>
                            <Select value={data.fieldType} onValueChange={val => setData({ ...data, fieldType: val })}>
                                <SelectTrigger className="text-slate-900">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEXT">Text</SelectItem>
                                    <SelectItem value="NUMBER">Number</SelectItem>
                                    <SelectItem value="DATE">Date</SelectItem>
                                    <SelectItem value="SELECT">Select/Dropdown</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2 flex items-center h-10 pb-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isRequired"
                                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                    checked={data.isRequired}
                                    onChange={e => setData({ ...data, isRequired: e.target.checked })}
                                />
                                <Label htmlFor="isRequired" className="text-slate-700 cursor-pointer">Required</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAdd} className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white">Add Field</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
