"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner"; // Using sonner as seen in package.json

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

// Schema for validation
const depositSchema = z.object({
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(12, "Phone number too long"),
    amount: z.coerce.number().min(1, "Amount must be at least 1"),
});

type DepositFormValues = z.infer<typeof depositSchema>;

export function DepositForm({ memberId }: { memberId?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'POLLING' | 'SUCCESS' | 'FAILED'>('IDLE');
    const [message, setMessage] = useState('');

    const form = useForm<DepositFormValues>({
        resolver: zodResolver(depositSchema),
        defaultValues: {
            phoneNumber: "254",
            amount: 0,
        },
    });

    // Ref to hold interval ID for cleanup
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, []);

    async function onSubmit(data: DepositFormValues) {
        if (!memberId) {
            toast.error("Member ID missing. Cannot process deposit.");
            return;
        }

        setIsLoading(true);
        setStatus('IDLE');
        setMessage('');

        try {
            const response = await axios.post("/api/deposit", {
                phoneNumber: data.phoneNumber,
                amount: data.amount,
                memberId: memberId
            });

            if (response.data.success) {
                const checkoutRequestId = response.data.checkoutRequestId;
                toast.info("STK Push Initiated", {
                    description: "Please check your phone to complete the transaction.",
                });

                // Start Polling
                setStatus('POLLING');
                const startTime = Date.now();
                const timeout = 60000;

                if (intervalRef.current) clearInterval(intervalRef.current);

                intervalRef.current = setInterval(async () => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed > timeout) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        setIsLoading(false);
                        setStatus('IDLE');
                        toast.warning("Transaction took too long. Waiting for SMS...");
                        return;
                    }

                    try {
                        const res = await axios.get(`/api/transaction/status?id=${checkoutRequestId}`);
                        const txStatus = res.data.status;

                        if (txStatus === 'COMPLETED') {
                            if (intervalRef.current) clearInterval(intervalRef.current);
                            setStatus('SUCCESS');
                            toast.success("Deposit Successful!");
                            form.reset();
                            setIsLoading(false);
                        } else if (txStatus === 'FAILED') {
                            if (intervalRef.current) clearInterval(intervalRef.current);
                            setStatus('FAILED');
                            toast.error(res.data.failureReason || "Transaction Failed");
                            setIsLoading(false);
                        }
                    } catch (err) {
                        console.error("Polling error", err);
                    }
                }, 2000);

            } else {
                toast.error("Deposit Initiated but check failed", {
                    description: response.data.message
                });
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error("Deposit Error:", error);
            toast.error("Deposit Failed", {
                description: error.response?.data?.error || "Something went wrong. Please try again.",
            });
            setIsLoading(false);
        }
        // Note: We don't set isLoading(false) immediately if success, we wait for polling.
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Deposit to Capital Crew</CardTitle>
                <CardDescription>
                    Enter your phone number and amount to deposit via M-Pesa.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {status === 'SUCCESS' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-green-600 space-y-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold">Payment Received!</h3>
                        <p className="text-sm text-center text-muted-foreground">Your wallet has been credited.</p>
                        <Button variant="outline" onClick={() => setStatus('IDLE')}>Make Another Deposit</Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="2547..." {...field} disabled={isLoading || status === 'POLLING'} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (KES)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="100" {...field} disabled={isLoading || status === 'POLLING'} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {status === 'POLLING' && (
                                <div className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-md">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span className="text-sm font-medium">Processing payment... Please check your phone.</span>
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading || status === 'POLLING'}>
                                {isLoading || status === 'POLLING' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Deposit Funds
                                    </>
                                )}
                            </Button>
                            <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/50 rounded border text-center">
                                <p>Demo Mode: Uses Pesa Playground Simulator.</p>
                                <p>Ensure Simulator is running on localhost:8080</p>
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
