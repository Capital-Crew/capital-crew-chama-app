/**
 * Example Component: Toast Demo
 * 
 * Demonstrates the glassmorphism toast notifications
 */

"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export function ToastDemo() {
    return (
        <div className="flex flex-wrap gap-4 p-6">
            <Button
                onClick={() => {
                    toast.success(
                        "Payment Successful",
                        "Your loan payment of KES 5,000 has been processed"
                    )
                }}
                variant="default"
            >
                Success Toast
            </Button>

            <Button
                onClick={() => {
                    toast.error(
                        "Transaction Blocked",
                        "Insufficient funds in your wallet. Please add funds to continue.",
                        {
                            action: {
                                label: "Add Funds",
                                onClick: () => console.log("Navigate to wallet")
                            }
                        }
                    )
                }}
                variant="destructive"
            >
                Error Toast
            </Button>

            <Button
                onClick={() => {
                    toast.warning(
                        "Pending Approval",
                        "Your loan application requires 2 more approvals"
                    )
                }}
                variant="outline"
            >
                Warning Toast
            </Button>

            <Button
                onClick={() => {
                    toast.info(
                        "System Maintenance",
                        "Scheduled maintenance on Sunday 2:00 AM - 4:00 AM"
                    )
                }}
                variant="secondary"
            >
                Info Toast
            </Button>

            <Button
                onClick={() => {
                    const loadingToast = toast.loading(
                        "Processing Transaction",
                        "Please wait while we process your payment..."
                    )

                    // Simulate async operation
                    setTimeout(() => {
                        toast.dismiss(loadingToast)
                        toast.success("Transaction Complete", "Payment processed successfully")
                    }, 3000)
                }}
                variant="outline"
            >
                Loading Toast
            </Button>

            <Button
                onClick={() => {
                    toast.promise(
                        // Simulate API call
                        new Promise((resolve) => setTimeout(resolve, 2000)),
                        {
                            loading: "Submitting loan application...",
                            success: "Loan application submitted successfully!",
                            error: "Failed to submit loan application"
                        }
                    )
                }}
                variant="default"
            >
                Promise Toast
            </Button>
        </div>
    )
}
