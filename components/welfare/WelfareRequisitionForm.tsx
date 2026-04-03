'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { createWelfareRequisition } from '@/app/welfare-requisition-actions'
import { useFormAction } from '@/hooks/useFormAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'

type WelfareType = any // Import types properly in real app

interface MemberOption {
    id: string
    name: string
    memberNumber: number
}

interface WelfareRequisitionFormProps {
    welfareTypes: WelfareType[]
    members: MemberOption[]
}

export function WelfareRequisitionForm({ welfareTypes, members }: WelfareRequisitionFormProps) {
    const router = useRouter()
    const { isPending: isSubmitting, error, execute } = useFormAction()
    const [isSuccess, setIsSuccess] = useState(false)
    const [selectedTypeId, setSelectedTypeId] = useState<string>('')
    const [selectedMemberId, setSelectedMemberId] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [reason, setReason] = useState<string>('')
    const [customData, setCustomData] = useState<Record<string, any>>({})

    // Search state for beneficiary
    const [searchTerm, setSearchTerm] = useState('')

    const selectedType = welfareTypes.find(t => t.id === selectedTypeId)

    // Filter members for search
    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberNumber.toString().includes(searchTerm)
    ).slice(0, 50) // Limit results for performance

    // Reset custom data when type changes
    useEffect(() => {
        setCustomData({})
    }, [selectedTypeId])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!selectedMemberId) {
            toast.error('Please select a beneficiary')
            return
        }

        if (!selectedTypeId) {
            toast.error('Please select a welfare type')
            return
        }

        const amtNum = Number(amount)
        if (!amount || isNaN(amtNum) || amtNum <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        if (!reason) {
            toast.error('Reason is required')
            return
        }

        // Validate required custom fields
        if (selectedType?.customFields) {
            for (const field of selectedType.customFields) {
                if (field.isRequired && !customData[field.id]) {
                    toast.error(`Please provide ${field.fieldName}`)
                    return
                }
            }
        }

        await execute(async () => {
            const res = await createWelfareRequisition({
                welfareTypeId: selectedTypeId,
                memberId: selectedMemberId,
                amount: amtNum,
                reason,
                customFieldData: customData
            })

            if (res.success) {
                setIsSuccess(true)
                toast.success('Requisition submitted successfully')
                setTimeout(() => {
                    setIsSuccess(false)
                    setSelectedTypeId('')
                    setSelectedMemberId('')
                    setAmount('')
                    setReason('')
                    setCustomData({})
                    router.refresh()
                }, 2000)
                return { success: true }
            } else {
                return { success: false, error: res.error || 'Failed to submit requisition' }
            }
        })
    }

    if (isSuccess) {
        return (
            <Card className="border-green-200 bg-green-50 shadow-sm animate-in fade-in zoom-in duration-300">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-green-900">Submitted Successfully!</h3>
                        <p className="text-sm text-green-700">Your welfare requisition has been sent for approval.</p>
                    </div>
                    <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-100" onClick={() => setIsSuccess(false)}>
                        Submit Another
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>New Welfare Requisition</CardTitle>
                <CardDescription>Apply for welfare benefits for a member</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 step-container">
                    {}
                    <div className="space-y-2">
                        <Label>Beneficiary (Member)</Label>
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select beneficiary member" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2 sticky top-0 bg-white border-b z-10">
                                    <Input
                                        placeholder="Search by name or number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-8 text-xs"
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                                {filteredMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name} (#{member.memberNumber})
                                    </SelectItem>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <div className="p-2 text-xs text-center text-muted-foreground">No members found</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Benefit Type</Label>
                        <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select benefit type" />
                            </SelectTrigger>
                            <SelectContent>
                                {welfareTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedType?.description && (
                            <p className="text-sm text-muted-foreground mt-1 bg-slate-50 p-2 rounded">
                                {selectedType.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Amount (KES)</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Reason / Details</Label>
                        <Textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Provide details about your request..."
                        />
                    </div>

                    {}
                    {selectedType && selectedType.customFields && selectedType.customFields.length > 0 && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-sm font-medium text-slate-900">Additional Information</h4>

                            {selectedType.customFields.map((field: any) => (
                                <div key={field.id} className="space-y-2">
                                    <Label>
                                        {field.fieldName}
                                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </Label>

                                    {field.fieldType === 'TEXT' && (
                                        <Input
                                            value={customData[field.id] || ''}
                                            onChange={e => setCustomData({ ...customData, [field.id]: e.target.value })}
                                            required={field.isRequired}
                                        />
                                    )}

                                    {field.fieldType === 'NUMBER' && (
                                        <Input
                                            type="number"
                                            value={customData[field.id] || ''}
                                            onChange={e => setCustomData({ ...customData, [field.id]: e.target.value })}
                                            required={field.isRequired}
                                        />
                                    )}

                                    {field.fieldType === 'DATE' && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !customData[field.id] && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {customData[field.id] ? format(new Date(customData[field.id]), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={customData[field.id] ? new Date(customData[field.id]) : undefined}
                                                    onSelect={(date) => setCustomData({ ...customData, [field.id]: date?.toISOString() })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}

                                    {field.fieldType === 'SELECT' && field.options && (
                                        <Select
                                            value={customData[field.id] || ''}
                                            onValueChange={val => setCustomData({ ...customData, [field.id]: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {JSON.parse(field.options).map((opt: string) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <FormError message={error} />
                </CardContent>
                <CardFooter>
                    <SubmitButton
                        isPending={isSubmitting}
                        label="Submit Requisition"
                        pendingLabel="Submitting..."
                        className="w-full"
                    />
                </CardFooter>
            </form>
        </Card>
    )
}
