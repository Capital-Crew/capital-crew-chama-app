"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { changePassword } from "@/app/actions/auth-settings"

const formSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export function ChangePasswordForm() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const result = await changePassword(values);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess("Password successfully updated. Signing out to apply changes...");
            // Force Sign Out to clear the old session token (which still has mustChangePassword=true)
            // We use standard NextAuth client signout
            import("next-auth/react").then(({ signOut }) => {
                signOut({ callbackUrl: "/login?verified=true" });
            });
        }
        setIsLoading(false);
    }

    return (
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-black text-slate-900">Security Update Required</h1>
                <p className="text-sm text-slate-500">
                    You are using a temporary password. Please set a new secure password to continue.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm font-bold text-center">
                    {success}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 font-bold">Current Type Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Enter temporary password"
                                        className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 font-bold">New Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Min 6 characters"
                                        className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 font-bold">Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Re-enter new password"
                                        className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 font-bold" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </form>
            </Form>
        </div>
    )
}
