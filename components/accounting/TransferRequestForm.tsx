'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { getStrictGLAccounts } from '@/app/actions/system-accounting'
import { createTransferRequest } from '@/app/actions/transfer-actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowRightIcon, ArrowDownIcon, PlusIcon, SendIcon, AlertCircleIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function TransferRequestForm({ onSuccess }: { onSuccess?: () => void }) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            sourceAccountId: '',
            destinationAccountId: '',
            amount: '',
            description: ''
        }
    })

    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Watch values to display dynamic balances
    const sourceAccountId = watch('sourceAccountId')
    const destinationAccountId = watch('destinationAccountId')

    useEffect(() => {
        async function loadAccounts() {
            try {
                const data = await getStrictGLAccounts()
                setAccounts(data)
            } catch (error) {
                toast.error('Failed to load accounts')
            } finally {
                setLoading(false)
            }
        }
        loadAccounts()
    }, [])

    const getBalance = (accountId: string) => {
        const acc = accounts.find(a => a.id === accountId)
        return acc ? Number(acc.balance) : 0
    }

    const handleSetMax = (accountId: string) => {
        const balance = getBalance(accountId)
        // Use absolute value for transfer amount
        setValue('amount', Math.abs(balance).toString())
    }

    const onSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            const amount = parseFloat(data.amount)
            if (isNaN(amount) || amount <= 0) {
                toast.error('Invalid amount')
                return
            }

            const result = await createTransferRequest({
                sourceAccountId: data.sourceAccountId,
                destinationAccountId: data.destinationAccountId,
                amount,
                description: data.description
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Transfer requested successfully')
                reset()
                if (onSuccess) onSuccess()
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Source & Destination Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start relative">

                {/* Connector Line (Desktop) */}
                <div className="absolute top-12 left-0 right-0 h-px bg-slate-200 hidden md:block z-0" />

                {/* Arrow Indicator - Absolute Centered */}
                <div className="absolute left-1/2 top-12 -translate-x-1/2 -translate-y-1/2 z-10 flex justify-center pointer-events-none">
                    <div className="bg-slate-50 p-1.5 rounded-full border border-slate-200 text-slate-400">
                        <ArrowRightIcon className="w-4 h-4 hidden md:block" />
                        <ArrowDownIcon className="w-4 h-4 md:hidden" />
                    </div>
                </div>

                {/* Source Account */}
                <div className="relative z-0 space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Source Account</Label>
                    <Select onValueChange={(val) => setValue('sourceAccountId', val)}>
                        <SelectTrigger className="h-12 bg-red-50/50 border-red-100 focus:ring-red-200 text-red-900 font-medium">
                            <SelectValue placeholder="Select Source" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                    <span className="font-mono text-slate-400 mr-2 text-xs font-bold">{acc.code}</span>
                                    <span className="font-medium text-slate-900">{acc.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {sourceAccountId && (
                        <div className="flex justify-between text-xs px-1">
                            <span className="text-slate-400 font-medium">Current Balance:</span>
                            <button
                                type="button"
                                onClick={() => handleSetMax(sourceAccountId)}
                                className="font-mono font-bold text-red-600 hover:underline cursor-pointer"
                            >
                                {getBalance(sourceAccountId).toLocaleString()} (Max)
                            </button>
                        </div>
                    )}
                </div>

                {/* Destination Account */}
                <div className="relative z-0 space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Destination Account</Label>
                    <Select onValueChange={(val) => setValue('destinationAccountId', val)}>
                        <SelectTrigger className="h-12 bg-emerald-50/50 border-emerald-100 focus:ring-emerald-200 text-emerald-900 font-medium">
                            <SelectValue placeholder="Select Destination" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                    <span className="font-mono text-slate-400 mr-2 text-xs font-bold">{acc.code}</span>
                                    <span className="font-medium text-slate-900">{acc.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {destinationAccountId && (
                        <div className="flex justify-between text-xs px-1">
                            <span className="text-slate-400 font-medium">Current Balance:</span>
                            <button
                                type="button"
                                onClick={() => handleSetMax(destinationAccountId)}
                                className="font-mono font-bold text-emerald-600 hover:underline cursor-pointer"
                            >
                                {getBalance(destinationAccountId).toLocaleString()} (Max)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Amount (KES)</Label>
                    <div className="relative flex items-center">
                        <Input
                            type="number"
                            step="0.01"
                            className="h-12 text-lg font-bold font-mono pr-16"
                            placeholder="0.00"
                            {...register('amount', { required: true })}
                        />
                        <div className="absolute right-2 flex items-center gap-1">
                            {(sourceAccountId || destinationAccountId) && (
                                <button
                                    type="button"
                                    onClick={() => handleSetMax(sourceAccountId || destinationAccountId)}
                                    className="h-8 px-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 rounded-md transition-colors uppercase tracking-wider"
                                >
                                    Max
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Reason</Label>
                    <Input
                        className="h-12"
                        placeholder="e.g. Monthly Allocation"
                        {...register('description', { required: true })}
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100/50">
                <AlertCircleIcon className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800">
                    Requires <strong>1 additional approval</strong> to execute.
                </p>
            </div>

            <Button
                type="submit"
                disabled={isSubmitting || loading}
                className={cn(
                    "w-full h-12 rounded-lg text-sm font-bold uppercase tracking-wide",
                    isSubmitting ? "bg-slate-100 text-slate-400" : "bg-cyan-600 hover:bg-cyan-700 text-white"
                )}
            >
                {isSubmitting ? "Processing..." : "Submit Request"}
            </Button>
        </form>
    )
}
