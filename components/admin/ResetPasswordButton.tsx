"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { resetUserPassword } from "@/app/actions/admin-actions"
import { Loader2, LockKeyhole, Copy, Check } from "lucide-react"

interface ResetPasswordButtonProps {
    userId: string;
    userName?: string;
}

export function ResetPasswordButton({ userId, userName }: ResetPasswordButtonProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleReset() {
        setIsLoading(true);
        const result = await resetUserPassword(userId);
        setIsLoading(false);

        if (result.success && result.tempPassword) {
            setTempPassword(result.tempPassword);
        } else {
            alert(result.error || "Failed to reset password");
        }
    }

    function copyToClipboard() {
        if (tempPassword) {
            navigator.clipboard.writeText(tempPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function handleClose() {
        setOpen(false);
        setTempPassword(null); // Clear secret on close
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200">
                    <LockKeyhole className="w-3 h-3 mr-2" />
                    Reset Password
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to reset the password for <strong>{userName || "this user"}</strong>?
                        <br />
                        This will action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {tempPassword ? (
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-green-50 p-4 border border-green-100 text-center">
                            <p className="text-xs font-medium text-green-800 uppercase tracking-wider mb-2">Temporary Password</p>
                            <div className="text-3xl font-mono font-bold text-slate-900 tracking-widest break-all">
                                {tempPassword}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 text-center">
                            Share this password with the user immediately.<br />It will not be shown again.
                        </p>
                        <Button onClick={copyToClipboard} variant="secondary" className="w-full">
                            {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? "Copied!" : "Copy Password"}
                        </Button>
                    </div>
                ) : (
                    <div className="py-4">
                        <p className="text-sm text-slate-500">
                            The user will be required to change this password upon their next login.
                        </p>
                    </div>
                )}

                <DialogFooter className="sm:justify-end">
                    {!tempPassword ? (
                        <>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleReset}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Confirm Reset
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
