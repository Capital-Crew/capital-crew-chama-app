"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { changePassword, type PasswordChangeValues } from "@/app/actions/user-settings";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

function PasswordStrengthIndicator({ password }: { password: string }) {
    const checks = [
        { label: "At least 8 characters", test: password.length >= 8 },
        { label: "One uppercase letter", test: /[A-Z]/.test(password) },
        { label: "One lowercase letter", test: /[a-z]/.test(password) },
        { label: "One number", test: /[0-9]/.test(password) },
    ];

    const strength = checks.filter(c => c.test).length;
    const strengthPercent = (strength / checks.length) * 100;

    return (
        <div className="space-y-2 mt-2">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-300",
                        strengthPercent < 50 && "bg-red-500",
                        strengthPercent >= 50 && strengthPercent < 75 && "bg-amber-500",
                        strengthPercent >= 75 && "bg-green-500"
                    )}
                    style={{ width: `${strengthPercent}%` }}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                {checks.map((check, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                        {check.test ? (
                            <Check className="h-3 w-3 text-green-600" />
                        ) : (
                            <X className="h-3 w-3 text-slate-400" />
                        )}
                        <span className={cn(
                            check.test ? "text-green-700 dark:text-green-400" : "text-slate-500"
                        )}>
                            {check.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function PasswordChangeForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<PasswordChangeValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const newPassword = form.watch("newPassword");

    async function onSubmit(data: PasswordChangeValues) {
        setIsSubmitting(true);
        const result = await changePassword(data);
        setIsSubmitting(false);

        if (result.error) {
            toast.error("Error", result.error);
        } else {
            toast.success("Success", "Password changed successfully");
            form.reset();
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
                <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Enter current password"
                                        {...field}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
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
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        {...field}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </FormControl>
                            {newPassword && <PasswordStrengthIndicator password={newPassword} />}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        {...field}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                </Button>
            </form>
        </Form>
    );
}
