'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'
import { CalendarIcon, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LoanDecisionCardProps {
    loan: {
        id: string
        loanNo: string
        applicantName: string
        amount: number
        date: Date
        productName: string
        applicantImage?: string // Optional if we fetch it
    }
    onReview: (loanId: string) => void
    onQuickReject: (loanId: string) => void
}

export function LoanDecisionCard({ loan, onReview, onQuickReject }: LoanDecisionCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                <Avatar className="h-10 w-10 border border-slate-100">
                    <AvatarImage src={loan.applicantImage} alt={loan.applicantName} />
                    <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">
                        {loan.applicantName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">
                        {loan.applicantName}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {loan.loanNo}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full whitespace-nowrap">
                        {loan.productName}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="flex flex-col gap-1">
                    <div className="text-2xl font-black text-slate-800 tracking-tight">
                        {formatCurrency(loan.amount)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Applied {new Date(loan.date).toLocaleDateString()}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-3 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => onQuickReject(loan.id)}
                >
                    Reject
                </Button>
                <Button
                    size="sm"
                    className="w-full text-xs font-bold bg-[#0A192F] hover:bg-[#0A192F]/90 text-white"
                    onClick={() => onReview(loan.id)}
                >
                    Review
                </Button>
            </CardFooter>
        </Card>
    )
}
