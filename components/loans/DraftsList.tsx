'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowRight, Trash2, Clock } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
// import { discardDraft } from "@/app/actions/loan-application-actions" // Need to export this
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

interface Draft {
    id: string
    loanApplicationNumber: string
    updatedAt: string | Date
    amount?: number | null
    loanProduct?: {
        name: string
    } | null
}

export function DraftsList({ drafts, title }: { drafts: Draft[], title?: string }) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    if (!drafts || drafts.length === 0) return null

    const handleDiscard = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        if (!confirm("Are you sure you want to discard this application? This action cannot be undone.")) return

        setDeletingId(id)
        try {
            const { discardDraft } = await import("@/app/actions/loan-application-actions") // Dynamic import to avoid server/client issues if not careful, but actions are server.
            await discardDraft(id)
            toast.success("Draft discarded")
            router.refresh()
        } catch (error) {
            toast.error("Failed to discard draft")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-4 mb-8">
            {title && (
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider px-1">
                    {title} ({drafts.length})
                </h3>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft) => (
                    <Card key={draft.id} className="p-4 border-2 border-slate-200 border-dashed hover:border-blue-300 hover:bg-blue-50/30 transition-all group relative">
                        <Link href={`/loans/application/${draft.id}`} className="block">
                            <div className="flex justify-between items-start mb-3">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                                    {draft.loanApplicationNumber}
                                </Badge>

                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                                    DRAFT
                                </Badge>
                            </div>

                            <div className="space-y-1 mb-4">
                                <h4 className="font-bold text-slate-800 line-clamp-1">
                                    {draft.loanProduct?.name || "New Application"}
                                </h4>
                                <p className="text-sm text-slate-500 font-medium">
                                    {draft.amount ? formatCurrency(Number(draft.amount)) : 'Amount not set'}
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3 mt-2">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(draft.updatedAt)}</span>
                                </div>
                                <div className="flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                                    Continue <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        </Link>

                        <button
                            onClick={(e) => handleDiscard(draft.id, e)}
                            disabled={deletingId === draft.id}
                            className="absolute top-2 right-2 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            title="Discard Draft"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </Card>
                ))}
            </div>
        </div>
    )
}
