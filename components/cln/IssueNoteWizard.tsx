'use client'

import React, { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, ChevronLeft, Calendar, 
    Briefcase, Info, TrendingUp, DollarSign,
    CheckCircle2, AlertCircle, Loader2,
    PlusCircleIcon, ActivityIcon,
    ArrowRight, Check, Wallet2, 
    ShieldCheck, CalendarDays, Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form, FormControl, FormField, FormItem,
    FormLabel, FormMessage, FormDescription
} from '@/components/ui/form';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { CLNRepaymentService } from '@/lib/services/CLN/CLNRepaymentService';
import { Money } from '@/components/Money';
import { issueLoanNote } from '@/app/actions/cln-actions';
import { getMembers } from '@/app/actions/get-members';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

const clnSchema = z.object({
    title: z.string().min(10, "Title must be at least 10 characters"),
    requesterName: z.string().min(3, "Please provide your name"),
    requesterRelationship: z.string().optional(),
    purpose: z.string().min(20, "Please provide a bit more detail about the purpose"),
    totalAmount: z.coerce.number().min(1000, "Minimum amount is KES 1,000"),
    minSubscription: z.coerce.number().min(100, "Minimum subscription is KES 100"),
    maxSubscription: z.coerce.number().optional(),
    interestRate: z.coerce.number().min(1).max(100),
    tenorValue: z.coerce.number().min(1),
    tenorUnit: z.string().default('months'),
    repaymentMode: z.enum(['AT_MATURITY', 'COUPON', 'EMI_FLAT', 'EMI_REDUCING']),
    paymentIntervalMonths: z.coerce.number().min(1).default(1),
    subscriptionDeadline: z.string(),
    collateral: z.string().optional(),
    additionalNotes: z.string().optional()
});

type CLNFormValues = z.infer<typeof clnSchema>;

export function IssueNoteWizard({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idempotencyKey] = useState(() => uuidv4());
    const [members, setMembers] = useState<{ id: string, name: string | null }[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);

    React.useEffect(() => {
        async function fetchMembers() {
            try {
                const data = await getMembers();
                setMembers(data);
            } catch (error) {
                toast.error("Failed to load members for selection");
            } finally {
                setIsLoadingMembers(false);
            }
        }
        fetchMembers();
    }, []);
    
    const form = useForm<CLNFormValues>({
        resolver: zodResolver(clnSchema),
        defaultValues: {
            requesterName: '',
            tenorUnit: 'months',
            paymentIntervalMonths: 1,
            repaymentMode: 'COUPON',
            subscriptionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
    });

    const watchedValues = useWatch({ control: form.control });

    const previewSchedule = useMemo(() => {
        if (!watchedValues.totalAmount || !watchedValues.interestRate || !watchedValues.tenorValue) return null;
        try {
            return CLNRepaymentService.generateSchedule({
                principal: Number(watchedValues.totalAmount),
                annualInterestRate: Number(watchedValues.interestRate),
                tenorMonths: Number(watchedValues.tenorValue),
                paymentIntervalMonths: Number(watchedValues.paymentIntervalMonths) || 1,
                repaymentMode: watchedValues.repaymentMode as any,
                closureDate: new Date()
            });
        } catch (e) {
            return null;
        }
    }, [watchedValues]);

    const onSubmit = async (data: CLNFormValues) => {
        setIsSubmitting(true);
        console.log("Submitting CLN Data:", data);
        try {
            const result = await issueLoanNote({
                ...data,
                subscriptionDeadline: new Date(data.subscriptionDeadline),
                idempotencyKey
            });

            if (result.success && 'data' in result) {
                toast.success('Investment Note Submitted for Approval');
                router.push(`/loan-notes/${result.data.id}`);
                onComplete();
            } else {
                toast.error((result as any).message || "Something went wrong");
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (errors: any) => {
        console.error("Form Validation Errors:", errors);
        const firstError = Object.values(errors)[0] as any;
        if (firstError?.message) {
            toast.error(`Please check: ${firstError.message}`);
        } else {
            toast.error("Please fill in all required fields correctly.");
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const steps = [
        { id: 1, label: 'Context', description: 'About this note' },
        { id: 2, label: 'Economics', description: 'Financial terms' },
        { id: 3, label: 'Security', description: 'Repayment & safety' },
    ];

    return (
        <div className="max-w-7xl mx-auto py-10 px-6 h-full overflow-y-auto pb-20 scrollbar-hide bg-[#FBFBFC]">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Issue a new investment note</h2>
                    <p className="text-slate-500 text-sm font-medium">Clear and simple financing for your targeted capital needs.</p>
                </div>

                {/* Circular Stepper */}
                <div className="flex items-center gap-6">
                    {steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                    step > s.id ? "bg-slate-900 border-slate-900" : 
                                    step === s.id ? "border-slate-900" : "border-slate-200"
                                )}>
                                    {step > s.id ? (
                                        <Check className="w-5 h-5 text-white" />
                                    ) : (
                                        <span className={cn(
                                            "text-sm font-bold",
                                            step === s.id ? "text-slate-900" : "text-slate-400"
                                        )}>{s.id}</span>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    step === s.id ? "text-slate-900" : "text-slate-400"
                                )}>{s.label}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={cn(
                                    "w-12 h-[2px] mb-6 mx-2 transition-colors duration-500",
                                    step > s.id ? "bg-slate-900" : "bg-slate-200"
                                )} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Form Side */}
                <div className="lg:col-span-7">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-12">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div 
                                        key="step1"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-10"
                                    >
                                        <div className="space-y-8">
                                            <div className="pb-4">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">Context & Purpose</h3>
                                                <p className="text-slate-500 text-sm leading-relaxed">Let's start with the basics. What is this investment for and who is issuing it?</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormField
                                                    control={form.control}
                                                    name="requesterName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-700 font-medium">Who is issuing this note?</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl focus:ring-slate-950/5">
                                                                        <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select member"} />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {members.map(m => (
                                                                        <SelectItem key={m.id} value={m.name || 'Unnamed Member'}>
                                                                            {m.name || 'Unnamed Member'}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="title"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-700 font-medium">Give this note a title</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Asset Purchase Note" {...field} className="bg-white border-slate-200 h-12 rounded-xl focus:ring-slate-950/5" />
                                                            </FormControl>
                                                            <FormDescription className="text-xs">This is how investors will see your note.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="purpose"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-700 font-medium">What is the investment for?</FormLabel>
                                                        <FormControl>
                                                            <Textarea 
                                                                placeholder="Tell us about the project and why you're raising capital..." 
                                                                {...field} 
                                                                className="bg-white border-slate-200 rounded-2xl min-h-[160px] focus:ring-slate-950/5 p-5 leading-relaxed"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <Button 
                                                type="button" 
                                                onClick={nextStep}
                                                className="bg-slate-900 hover:bg-slate-800 text-white h-14 px-10 rounded-2xl font-bold shadow-sm transition-all active:scale-95"
                                            >
                                                Next: Financial details
                                                <ArrowRight className="w-5 h-5 ml-3" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div 
                                        key="step2"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-10"
                                    >
                                        <div className="space-y-8">
                                            <div className="pb-4">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">Economics & Timeline</h3>
                                                <p className="text-slate-500 text-sm">How much capital are you seeking and what are the return terms?</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <FormField
                                                    control={form.control}
                                                    name="totalAmount"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-700 font-medium">How much do you need? (KES)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="Total target amount" {...field} className="bg-white border-slate-200 h-14 text-lg font-bold rounded-2xl" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="interestRate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-700 font-medium">Annual interest yield (%)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="Interest rate per year" {...field} className="bg-white border-slate-200 h-14 text-lg font-bold rounded-2xl" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                                                <FormField
                                                    control={form.control}
                                                    name="tenorValue"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-600 text-sm">How long?</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" {...field} className="bg-white" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="tenorUnit"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-600 text-sm">In what units?</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-white">
                                                                        <SelectValue placeholder="Unit" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="months">Months</SelectItem>
                                                                    <SelectItem value="quarters">Quarters</SelectItem>
                                                                    <SelectItem value="years">Years</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="repaymentMode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-600 text-sm">Disbursement mode?</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-white">
                                                                        <SelectValue placeholder="Select mode" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="COUPON">Interest Only</SelectItem>
                                                                    <SelectItem value="EMI_FLAT">Monthly Equal Payments</SelectItem>
                                                                    <SelectItem value="AT_MATURITY">Bullet (End of term)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormField
                                                    control={form.control}
                                                    name="minSubscription"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-700 font-medium">Minimum investment per person</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" {...field} className="bg-white h-12 rounded-xl" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="subscriptionDeadline"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-700 font-medium">Deadline for investments</FormLabel>
                                                            <FormControl>
                                                                <Input type="date" {...field} className="bg-white h-12 rounded-xl" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-4">
                                            <Button type="button" variant="ghost" onClick={prevStep} className="h-14 px-8 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all">
                                                Back
                                            </Button>
                                            <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-slate-800 text-white h-14 px-10 rounded-2xl font-bold shadow-sm transition-all active:scale-95">
                                                Next: Security & Repayment
                                                <ArrowRight className="w-5 h-5 ml-3" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div 
                                        key="step3"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-10"
                                    >
                                        <div className="space-y-8">
                                            <div className="pb-4">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">Repayment & Security</h3>
                                                <p className="text-slate-500 text-sm">Final details on the collateral and security of the note.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormField
                                                    control={form.control}
                                                    name="collateral"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-700 font-medium">Any collateral? (Optional)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Assets or guarantees..." {...field} className="bg-white border-slate-200 h-14 rounded-xl" />
                                                            </FormControl>
                                                            <FormDescription className="text-xs">Describe assets securing this note.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-start gap-4">
                                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 mb-1">Treasury Verification</p>
                                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Your note will be reviewed by the Treasury for compliance before being listed in the market.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-10 border-t border-slate-100 mt-10">
                                            <Button type="button" variant="ghost" onClick={prevStep} className="h-16 px-10 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all">
                                                Back
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                disabled={isSubmitting}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-16 px-12 rounded-[24px] font-bold shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-3">
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        <span>Publishing...</span>
                                                    </div>
                                                ) : "Issue investment note"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </Form>
                </div>

                {/* Light Minimalist Sidebar */}
                <div className="lg:col-span-5 relative lg:border-l border-slate-200 lg:pl-16">
                    <div className="sticky top-0">
                        <div className="flex items-center gap-3 mb-10">
                            <Receipt className="w-5 h-5 text-slate-400" />
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">Summary Preview</p>
                        </div>

                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative group">
                            {!previewSchedule ? (
                                <div className="py-24 text-center space-y-6">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                                        <TrendingUp className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">Waiting for financial terms...</p>
                                </div>
                            ) : (
                                <div className="p-10 space-y-12">
                                    <div className="space-y-8">
                                        <div className="pb-8 border-b border-slate-100">
                                            <p className="text-xs font-semibold text-slate-400 mb-2">Total repayment amount</p>
                                            <div className="text-4xl font-black text-slate-900 tracking-tight">
                                                <Money amount={previewSchedule.reduce((s, e) => s + e.groupAmount, 0)} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Yield cost</p>
                                                <div className="text-xl font-bold text-emerald-600">
                                                    <Money amount={previewSchedule.reduce((s, e) => s + e.interestComponent, 0)} />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Maturity date</p>
                                                <div className="text-sm font-bold text-slate-900">
                                                    {previewSchedule[previewSchedule.length - 1].dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-3 custom-scrollbar-light">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Detailed intervals</p>
                                        {previewSchedule.map((evt, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-5 rounded-3xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-slate-50">
                                                <div className="flex gap-5 items-center">
                                                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-xs font-bold text-slate-900 border border-slate-200 shadow-sm">
                                                        {evt.eventNumber}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[11px] font-bold text-slate-900">{new Date(evt.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                                        <div className={cn(
                                                            "inline-block px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-tight",
                                                            evt.paymentType === 'DIVIDEND' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        )}>
                                                            {evt.paymentType === 'DIVIDEND' ? 'Interest only' : evt.paymentType === 'PRINCIPAL' ? 'Capital payout' : 'Mixed installment'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Money amount={evt.groupAmount} className="text-slate-900 text-sm font-bold tracking-tight" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="pt-8 border-t border-slate-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <CalendarDays className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final payout</p>
                                            <p className="text-xs font-bold text-slate-900">{previewSchedule[previewSchedule.length - 1].dueDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar-light::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
