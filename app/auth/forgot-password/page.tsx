import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900">Forgot Password?</h1>
                    <p className="text-slate-600">
                        For security reasons, we do not support automated email resets.
                    </p>
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-100">
                        Please contact a <strong>System Administrator</strong>, <strong>Chairperson</strong>, or <strong>Secretary</strong> to request a password reset.
                        <br /><br />
                        They will provide you with a temporary password to log in.
                    </div>
                </div>

                <Button asChild className="w-full" variant="outline">
                    <Link href="/login">
                        Back to Login
                    </Link>
                </Button>
            </div>
        </div>
    )
}
