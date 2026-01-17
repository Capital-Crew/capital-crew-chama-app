'use client'

import { useState } from 'react'
import { MoreVertical, Trash2, Ban, CheckCircle } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { deleteAccount, toggleAccountStatus } from '@/app/accounts-actions' // Ensure this export exists!
import { toast } from '@/lib/toast'

export function AccountActionsMenu({ account, onUpdate }: { account: any, onUpdate: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${account.code} - ${account.name}? This cannot be undone.`)) return

        setLoading(true)
        try {
            await deleteAccount(account.id)
            toast.success("Account deleted successfully")
            onUpdate()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        const newStatus = !account.isActive
        const action = newStatus ? "activate" : "deactivate"
        if (!confirm(`Are you sure you want to ${action} this account?`)) return

        setLoading(true)
        try {
            await toggleAccountStatus(account.id, newStatus)
            toast.success(`Account ${newStatus ? 'activated' : 'deactivated'}`)
            onUpdate()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleStatus} disabled={loading}>
                    {account.isActive ? (
                        <>
                            <Ban className="mr-2 h-4 w-4 text-orange-500" />
                            <span>Deactivate</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            <span>Activate</span>
                        </>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} disabled={loading || account._count?.journalLines > 0} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Account</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
