'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { updateBeneficiaries } from '@/app/actions/update-kin'
import { PlusCircle, Trash2, AlertCircle, Save } from 'lucide-react'
import { toast } from '@/lib/toast'

type Beneficiary = {
    name: string
    relationship: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'OTHER'
    nationality: string
    phone: string
    altPhone?: string
    allocation: number
}

interface NextOfKinFormProps {
    memberId: string
    initialData: Beneficiary[]
}

export function NextOfKinForm({ memberId, initialData }: NextOfKinFormProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<{ beneficiaries: Beneficiary[] }>({
        defaultValues: {
            beneficiaries: initialData.length > 0 ? initialData : [{ name: '', relationship: 'SPOUSE', nationality: 'KE', phone: '', allocation: 100 }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'beneficiaries'
    })

    const beneficiaries = watch('beneficiaries')
    const totalAllocation = beneficiaries.reduce((sum, b) => sum + (parseFloat(b.allocation as any) || 0), 0)
    const isTotalValid = Math.abs(totalAllocation - 100) < 0.01

    const onSubmit = async (data: { beneficiaries: Beneficiary[] }) => {
        if (!isTotalValid) {
            setError(`Total allocation must equal 100%. Current: ${totalAllocation.toFixed(2)}%`)
            return
        }

        setSaving(true)
        setError(null)

        try {
            const result = await updateBeneficiaries(memberId, data.beneficiaries)
            if (result.error) {
                setError(result.error)
            } else {
                // Success feedback
                alert('Beneficiaries updated successfully')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Manage Beneficiaries</h3>
                    <p className="text-sm text-slate-500">Designate who inherits your shares and deposits.</p>
                </div>
                <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${isTotalValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span>Total: {totalAllocation.toFixed(2)}%</span>
                    {!isTotalValid && <AlertCircle className="w-4 h-4" />}
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 items-start bg-slate-50 p-4 rounded-lg border border-slate-100 relative group">

                            {/* Name */}
                            <div className="col-span-12 md:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input
                                    {...register(`beneficiaries.${index}.name` as const, { required: "Name is required" })}
                                    className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500"
                                    placeholder="Legal Name"
                                />
                                {errors.beneficiaries?.[index]?.name && <span className="text-xs text-red-500">{errors.beneficiaries[index]?.name?.message}</span>}
                            </div>

                            {/* Relationship */}
                            <div className="col-span-12 md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Relationship</label>
                                <select
                                    {...register(`beneficiaries.${index}.relationship` as const)}
                                    className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-md px-3 py-2"
                                >
                                    <option value="SPOUSE">Spouse</option>
                                    <option value="CHILD">Child</option>
                                    <option value="PARENT">Parent</option>
                                    <option value="SIBLING">Sibling</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            {/* Nationality */}
                            <div className="col-span-12 md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label>
                                <select
                                    {...register(`beneficiaries.${index}.nationality` as const)}
                                    className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-md px-3 py-2"
                                >
                                    <option value="KE">🇰🇪 Kenya</option>
                                    <option value="UG">🇺🇬 Uganda</option>
                                    <option value="TZ">🇹🇿 Tanzania</option>
                                    <option value="US">🇺🇸 USA</option>
                                    <option value="UK">🇬🇧 UK</option>
                                </select>
                            </div>

                            {/* Phone */}
                            <div className="col-span-12 md:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                <input
                                    {...register(`beneficiaries.${index}.phone` as const, {
                                        required: "Phone is required",
                                        validate: (value) => {
                                            const nationality = watch(`beneficiaries.${index}.nationality`);
                                            const patterns: Record<string, { regex: RegExp; example: string }> = {
                                                'KE': { regex: /^(?:\+254|0)[17](?:[0-9] ?){8}$/, example: '+2547...' },
                                                'US': { regex: /^\+1[2-9]\d{9}$/, example: '+1...' },
                                                'UG': { regex: /^(?:\+256|0)[7]\d{8}$/, example: '+256...' },
                                                'TZ': { regex: /^(?:\+255|0)[67]\d{8}$/, example: '+255...' },
                                                'UK': { regex: /^\+44\d{10}$/, example: '+44...' }
                                            };
                                            const pattern = patterns[nationality] || patterns['KE'];
                                            // Strip spaces for regex test
                                            if (!pattern.regex.test(value.replace(/\s+/g, ''))) {
                                                return `Invalid format. Use ${pattern.example}`;
                                            }
                                            return true;
                                        }
                                    })}
                                    className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2"
                                    placeholder={
                                        watch(`beneficiaries.${index}.nationality`) === 'US' ? '+1 234 567 8900' :
                                            watch(`beneficiaries.${index}.nationality`) === 'UK' ? '+44 7911 123456' :
                                                watch(`beneficiaries.${index}.nationality`) === 'UG' ? '+256 700 000000' :
                                                    watch(`beneficiaries.${index}.nationality`) === 'TZ' ? '+255 700 000000' :
                                                        '+254 700 000000'
                                    }
                                />
                                {errors.beneficiaries?.[index]?.phone && <span className="text-xs text-red-500">{errors.beneficiaries[index]?.phone?.message}</span>}
                            </div>

                            {/* Alt Phone (Optional) */}
                            <div className="col-span-12 md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alt Phone</label>
                                <input
                                    {...register(`beneficiaries.${index}.altPhone` as const)}
                                    className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2"
                                    placeholder={
                                        watch(`beneficiaries.${index}.nationality`) === 'US' ? 'Optional (+1...)' :
                                            watch(`beneficiaries.${index}.nationality`) === 'UK' ? 'Optional (+44...)' :
                                                watch(`beneficiaries.${index}.nationality`) === 'UG' ? 'Optional (+256...)' :
                                                    watch(`beneficiaries.${index}.nationality`) === 'TZ' ? 'Optional (+255...)' :
                                                        'Optional (+254...)'
                                    }
                                />
                            </div>

                            {/* Allocation */}
                            <div className="col-span-12 md:col-span-2 relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Allocation %</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register(`beneficiaries.${index}.allocation` as const, {
                                            required: true,
                                            min: 0,
                                            max: 100,
                                            valueAsNumber: true
                                        })}
                                        className="w-full text-sm font-bold text-teal-700 bg-white border border-slate-300 rounded-md px-3 py-2 pr-8"
                                    />
                                    <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 border border-slate-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Beneficiary"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => append({ name: '', relationship: 'CHILD', nationality: 'KE', phone: '', allocation: 0 })}
                        className="flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Add Beneficiary
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={!isTotalValid || saving}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white shadow-sm transition-all
                            ${!isTotalValid || saving ? 'bg-slate-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}
                        `}
                    >
                        {saving ? (
                            <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    )
}
