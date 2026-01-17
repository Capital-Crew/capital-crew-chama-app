"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react"

export default function ToastTestPage() {
    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Glassmorphism Toast Notifications Test</h1>
                <p className="text-muted-foreground">
                    Click the buttons below to test the new notification system
                </p>
            </div>

            <div className="grid gap-6">
                {/* Success Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            Success Notifications
                        </CardTitle>
                        <CardDescription>Green glass effect for successful operations</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => {
                                toast.success("Payment Successful", "Your loan payment of KES 5,000 has been processed")
                            }}
                            variant="default"
                        >
                            Payment Success
                        </Button>
                        <Button
                            onClick={() => {
                                toast.success("Loan Approved", "Your loan application has been approved by all officials")
                            }}
                            variant="default"
                        >
                            Loan Approved
                        </Button>
                        <Button
                            onClick={() => {
                                toast.success("Funds Added", "KES 10,000 has been added to your wallet")
                            }}
                            variant="default"
                        >
                            Funds Added
                        </Button>
                    </CardContent>
                </Card>

                {/* Error Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            Error Notifications
                        </CardTitle>
                        <CardDescription>Red glass effect for blocked/prohibited actions</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => {
                                toast.error(
                                    "Compliance Error",
                                    "You cannot approve your own loan application"
                                )
                            }}
                            variant="destructive"
                        >
                            Compliance Error
                        </Button>
                        <Button
                            onClick={() => {
                                toast.error(
                                    "Transaction Blocked",
                                    "Insufficient funds in your wallet. Please add funds to continue.",
                                    {
                                        action: {
                                            label: "Add Funds",
                                            onClick: () => toast.info("Navigating to wallet...")
                                        }
                                    }
                                )
                            }}
                            variant="destructive"
                        >
                            Insufficient Funds (with Action)
                        </Button>
                        <Button
                            onClick={() => {
                                toast.error("System Configuration Error", "Expense Payment Source GL account is not mapped")
                            }}
                            variant="destructive"
                        >
                            Config Error
                        </Button>
                    </CardContent>
                </Card>

                {/* Warning Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            Warning Notifications
                        </CardTitle>
                        <CardDescription>Amber glass effect for warnings</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => {
                                toast.warning("Pending Approval", "Your loan application requires 2 more approvals")
                            }}
                            variant="outline"
                        >
                            Pending Approval
                        </Button>
                        <Button
                            onClick={() => {
                                toast.warning("Payment Overdue", "Your loan payment is 5 days overdue. Penalties may apply.")
                            }}
                            variant="outline"
                        >
                            Overdue Payment
                        </Button>
                    </CardContent>
                </Card>

                {/* Info Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-cyan-600" />
                            Info Notifications
                        </CardTitle>
                        <CardDescription>Cyan glass effect for information</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => {
                                toast.info("System Maintenance", "Scheduled maintenance on Sunday 2:00 AM - 4:00 AM")
                            }}
                            variant="secondary"
                        >
                            Maintenance Notice
                        </Button>
                        <Button
                            onClick={() => {
                                toast.info("New Feature", "Check out the new loan calculator in the dashboard!")
                            }}
                            variant="secondary"
                        >
                            Feature Announcement
                        </Button>
                    </CardContent>
                </Card>

                {/* Loading & Promise Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                            Loading & Promise Notifications
                        </CardTitle>
                        <CardDescription>Async operation handling</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => {
                                const loadingId = toast.loading(
                                    "Processing Transaction",
                                    "Please wait while we process your payment..."
                                )

                                setTimeout(() => {
                                    toast.dismiss(loadingId)
                                    toast.success("Transaction Complete", "Payment processed successfully")
                                }, 3000)
                            }}
                            variant="outline"
                        >
                            Loading → Success
                        </Button>
                        <Button
                            onClick={() => {
                                toast.promise(
                                    new Promise((resolve) => setTimeout(resolve, 2000)),
                                    {
                                        loading: "Submitting loan application...",
                                        success: "Loan application submitted successfully!",
                                        error: "Failed to submit loan application"
                                    }
                                )
                            }}
                            variant="outline"
                        >
                            Promise Toast
                        </Button>
                    </CardContent>
                </Card>

                {/* Multiple Toasts (Stacking Test) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stacking Test</CardTitle>
                        <CardDescription>Test multiple toasts appearing at once</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => {
                                toast.success("First notification", "This is the first toast")
                                setTimeout(() => toast.info("Second notification", "This stacks on top"), 500)
                                setTimeout(() => toast.warning("Third notification", "This stacks even higher"), 1000)
                            }}
                            variant="default"
                        >
                            Show 3 Stacked Toasts
                        </Button>
                        <Button
                            onClick={() => {
                                for (let i = 1; i <= 5; i++) {
                                    setTimeout(() => {
                                        toast.info(`Notification ${i}`, `This is toast number ${i}`)
                                    }, i * 300)
                                }
                            }}
                            variant="outline"
                        >
                            Show 5 Stacked Toasts
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">What to look for:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Semi-transparent backgrounds with blur effect (glassmorphism)</li>
                    <li>Color-coded variants (green, red, amber, cyan)</li>
                    <li>Smooth slide-up animations</li>
                    <li>Toasts stack on top of each other with proper spacing</li>
                    <li>Icons appear on the left side</li>
                    <li>Action buttons work correctly</li>
                    <li>Auto-dismiss after 4 seconds</li>
                    <li>Dark mode compatibility (try switching themes)</li>
                </ul>
            </div>
        </div>
    )
}
