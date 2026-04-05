'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, X, Calendar as CalendarIcon } from 'lucide-react';
import { AdjustmentCategory } from '@/lib/types';
import { searchLoans } from '@/app/actions/loan-adjustment-actions';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LoanAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    loanId?: string; // Optional if we search
    currentBalance?: number;
    currency?: string;
    onAdjustmentSubmit: (data: {
        adjustmentType: 'increase' | 'decrease';
        category: AdjustmentCategory;
        amount: number;
        description: string;
        loanId: string;
        transactionDate?: Date;
    }) => void;
}

export function LoanAdjustmentModal({
    isOpen,
    onClose,
    loanId: initialLoanId,
    currentBalance: initialBalance = 0,
    currency = 'KES',
    onAdjustmentSubmit,
}: LoanAdjustmentModalProps) {
    const [searchInput, setSearchInput] = useState('');
    const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
    const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('decrease');
    const [category, setCategory] = useState<string>(AdjustmentCategory.PENALTY);
    const [useCustomCategory, setUseCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isBackdated, setIsBackdated] = useState(false);
    const [transactionDate, setTransactionDate] = useState<Date | undefined>(new Date());

    // Initialize if passed directly
    useEffect(() => {
        if (initialLoanId) {
            // We might want to fetch details if not provided, but for now assume caller provided context or we search.
            // If specific loan passed, lock it? Or just pre-fill.
        }
    }, [initialLoanId]);

    // Search effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchInput.trim().length > 0) { // Allow single digit search (e.g. "5" -> LN005)
                const results = await searchLoans(searchInput);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchInput]);

    const categoryOptions = [
        { value: AdjustmentCategory.PENALTY, label: 'Penalty/Late Charge' },
        { value: AdjustmentCategory.LEGAL_FEE, label: 'Legal Fee' },
        { value: AdjustmentCategory.BOUNCED_CHEQUE, label: 'Bounced Cheque Penalty' },
        { value: AdjustmentCategory.RECOVERY_COST, label: 'Recovery Costs' },
        { value: AdjustmentCategory.SYSTEM_CORRECTION, label: 'System Correction' },
        { value: AdjustmentCategory.WAIVER, label: 'Charge Waiver' },
    ];

    // Determine which loan to use
    const activeLoan = selectedLoan || (initialLoanId ? {
        id: initialLoanId,
        balance: initialBalance,
        loanApplicationNumber: initialLoanId, // Fallback
        member: { name: 'Current Borrower' } // Fallback
    } : null);

    const currentLoanBalance = activeLoan ? Number(activeLoan.balance || activeLoan.outstandingBalance || 0) : 0;

    const newBalance = amount && activeLoan
        ? adjustmentType === 'increase'
            ? currentLoanBalance + parseFloat(amount)
            : currentLoanBalance - parseFloat(amount)
        : currentLoanBalance;

    const isValid = Boolean(
        activeLoan?.id &&
        amount &&
        !isNaN(parseFloat(amount)) &&
        parseFloat(amount) > 0 &&
        description.trim().length >= 10 &&
        (useCustomCategory ? customCategory.trim() !== '' : category !== '')
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsSubmitting(true);
        try {
            const finalCategory = useCustomCategory ? customCategory : category;
            await onAdjustmentSubmit({
                loanId: activeLoan.id,
                adjustmentType,
                category: finalCategory as AdjustmentCategory,
                amount: parseFloat(amount),
                description,
                transactionDate: isBackdated ? transactionDate : undefined,
            });

            // Reset form
            setAdjustmentType('decrease');
            setCategory(AdjustmentCategory.PENALTY);
            setUseCustomCategory(false);
            setCustomCategory('');
            setAmount('');
            setDescription('');
            setSelectedLoan(null);
            setSearchInput('');
            setIsBackdated(false);
            setTransactionDate(new Date());
            onClose();
        } catch (error) {
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2 text-slate-900">
                        <div className="p-2 bg-cyan-100 rounded-full">
                            <AlertCircle className="w-6 h-6 text-cyan-600" />
                        </div>
                        Post Manual Adjustment
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900 font-medium">
                            This is a manual override operation. All changes are audited and require proper documentation.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {}
                        {!initialLoanId && (
                            <div className="space-y-3">
                                <label htmlFor="search" className="text-sm font-bold text-slate-700">
                                    Search by Loan ID or Number
                                </label>
                                <input
                                    id="search"
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="e.g., LN-2026..."
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                                />

                                {}
                                {searchInput && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700">
                                            Available Loans ({searchResults.length})
                                        </label>
                                        <div className="grid gap-2 max-h-48 overflow-y-auto pr-2">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((loan) => (
                                                    <button
                                                        key={loan.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedLoan(loan);
                                                            setSearchInput('');
                                                            setSearchResults([]);
                                                        }}
                                                        className={`p-4 rounded-xl border-2 transition-all text-left group ${selectedLoan?.id === loan.id
                                                            ? 'bg-cyan-50 border-cyan-500 shadow-sm'
                                                            : 'bg-white border-slate-200 hover:border-cyan-300 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition-colors">{loan.loanApplicationNumber}</p>
                                                                <p className="text-xs text-slate-500 mt-1 font-medium">{loan.member.name} • {loan.loanProduct.productName}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-black text-slate-700">
                                                                    {currency} {Number(loan.outstandingBalance).toLocaleString()}
                                                                </p>
                                                                <p className="text-[10px] uppercase font-bold text-slate-400">Balance</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-medium text-sm">
                                                    No loans found matching "{searchInput}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {}
                        {activeLoan && (
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <p className="text-xs font-black text-cyan-600 uppercase tracking-widest mb-1.5">
                                            Selected Loan
                                        </p>
                                        <p className="text-xl font-black text-slate-900">{activeLoan.loanApplicationNumber || activeLoan.id}</p>
                                        <p className="text-sm text-slate-600 font-medium mt-1">{activeLoan.member?.name}</p>
                                    </div>
                                    <div className="text-right bg-white/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                            Current Balance
                                        </p>
                                        <p className="text-lg font-black text-slate-700">
                                            {currency} {currentLoanBalance.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">Adjustment Type</label>
                            <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('increase')}
                                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${adjustmentType === 'increase'
                                        ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${adjustmentType === 'increase' ? 'bg-cyan-500' : 'bg-slate-300'}`} />
                                    Increase Balance (Charge)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('decrease')}
                                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${adjustmentType === 'decrease'
                                        ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${adjustmentType === 'decrease' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                                    Decrease Balance (Waiver)
                                </button>
                            </div>
                        </div>

                        {}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">
                                Category
                            </label>

                            {!useCustomCategory ? (
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full appearance-none px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-bold text-sm"
                                    >
                                        {categoryOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-bold text-slate-700">Backdate Adjustment?</label>
                                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Neutralize subsequent penalties automatically</p>
                                </div>
                                <Switch
                                    checked={isBackdated}
                                    onCheckedChange={setIsBackdated}
                                />
                            </div>

                            {isBackdated && (
                                <div className="space-y-2 pt-2 border-t border-slate-200">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Transaction Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-bold py-6 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 transition-all",
                                                    !transactionDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-3 h-5 w-5 text-cyan-600" />
                                                {transactionDate ? format(transactionDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={transactionDate}
                                                onSelect={setTransactionDate}
                                                initialFocus
                                                disabled={(date) => date > new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>

                        {}
                        <div className="space-y-3">
                            <label htmlFor="amount" className="text-sm font-bold text-slate-700">
                                Amount ({currency})
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                    {currency}
                                </span>
                                <input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 text-lg font-bold focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all icon-hide"
                                />
                            </div>
                        </div>

                        {}
                        {amount && activeLoan && (
                            <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <div className="grid grid-cols-3 gap-4 relative z-10">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Old Balance</p>
                                        <p className="text-sm font-black text-slate-300">
                                            {currency} {currentLoanBalance.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className={`px-3 py-1 rounded-lg font-bold text-xs ${adjustmentType === 'increase' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                                            {adjustmentType === 'increase' ? '+' : '-'} {currency} {parseFloat(amount).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">New Balance</p>
                                        <p className={`text-xl font-black ${newBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                            {currency} {newBalance.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {}
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <label htmlFor="description" className="text-sm font-bold text-slate-700">
                                        Statement Description
                                    </label>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        Visible on member statement
                                    </p>
                                </div>
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md border border-slate-200">
                                    Required
                                </span>
                            </div>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Late payment penalty imposed. Case No. 123/2024"
                                rows={3}
                                className="resize-none bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-xl p-3 text-sm font-medium"
                            />
                        </div>

                        {}
                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!isValid || isSubmitting}
                                className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 ${!isValid || isSubmitting
                                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>Post Adjustment</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
