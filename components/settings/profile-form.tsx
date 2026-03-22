"use client"

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, updateProfileImage } from "@/app/actions/user-settings";
import { cn } from "@/lib/utils";
import { AvatarSelector } from "./AvatarSelector";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import { toast } from "@/lib/toast";

const profileSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    contact: z.string().min(10, {
        message: "Phone number must be valid.",
    }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    user: any; // Type strictly in real usage
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || "",
            contact: user?.member?.contact || "",
        },
        mode: "onChange",
    });

    async function onSubmit(data: ProfileFormValues) {
        setIsUpdating(true);
        const result = await updateProfile(data);
        setIsUpdating(false);

        if (result.error) {
            toast.error("Error", result.error);
        } else {
            toast.success("Success", "Profile updated successfully");
            router.refresh();
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic size check (e.g. 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Error", "File too large. Max 2MB.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const result = await updateProfileImage(formData);
        setIsUploading(false);

        if (result.success) {
            toast.success("Success", "Profile picture updated");
            router.refresh();
        } else {
            toast.error("Error", result.error || "Upload failed");
        }
    };

    const avatarUrl = getAvatarUrl(user);
    const initials = getInitials(user?.name);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                {}
                <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32 ring-4 ring-slate-100 dark:ring-slate-800">
                        <AvatarImage src={avatarUrl || ""} alt={user?.name || "User"} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-white font-black">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {isUploading && <p className="text-xs text-primary animate-pulse">Uploading...</p>}
                </div>

                {}
                <div className="flex-1">
                    <AvatarSelector
                        currentPreset={user?.avatarPreset}
                        currentImage={user?.image}
                        onUploadClick={() => fileInputRef.current?.click()}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-lg">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is your public display name.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid gap-2">
                        <FormLabel>Email</FormLabel>
                        <Input value={user?.email || ""} disabled className="bg-muted text-muted-foreground opacity-100" />
                        <p className="text-[0.8rem] text-muted-foreground">
                            Email cannot be changed contact admin for assistance.
                        </p>
                    </div>

                    <FormField
                        control={form.control}
                        name="contact"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="+254..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save changes
                    </Button>
                </form>
            </Form>
        </div>
    );
}
