"use client"

import { useState } from "react";
import { Check, Upload } from "lucide-react";
import Image from "next/image";
import { AVATAR_PRESETS } from "@/lib/avatar-utils";
import { updateAvatarPreset } from "@/app/actions/user-settings";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface AvatarSelectorProps {
    currentPreset?: string | null;
    currentImage?: string | null;
    onUploadClick: () => void;
}

export function AvatarSelector({ currentPreset, currentImage, onUploadClick }: AvatarSelectorProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(currentPreset);

    const handlePresetSelect = async (presetId: string) => {
        setIsUpdating(true);
        setSelectedPreset(presetId);

        const result = await updateAvatarPreset(presetId);
        setIsUpdating(false);

        if (result.error) {
            toast.error("Error", result.error);
            setSelectedPreset(currentPreset); // Revert on error
        } else {
            toast.success("Success", "Avatar updated successfully");
        }
    };

    const hasCustomImage = currentImage && !currentPreset;

    return (
        <div className="space-y-4">
            <div>
                <h4 className="text-sm font-medium mb-3">Choose an avatar</h4>
                <div className="grid grid-cols-3 gap-3">
                    {AVATAR_PRESETS.map((preset) => {
                        const isSelected = selectedPreset === preset.id && !hasCustomImage;

                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => handlePresetSelect(preset.id)}
                                disabled={isUpdating}
                                className={cn(
                                    "relative aspect-square rounded-xl border-2 transition-all hover:scale-105",
                                    "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
                                    isSelected
                                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950"
                                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700",
                                    isUpdating && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Image
                                    src={preset.path}
                                    alt={preset.name}
                                    fill
                                    className="object-cover rounded-lg p-2"
                                />
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 bg-cyan-500 rounded-full p-1">
                                        <Check className="h-3 w-3 text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-950 px-2 text-slate-500">Or</span>
                </div>
            </div>

            <button
                type="button"
                onClick={onUploadClick}
                className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                    "border-2 border-dashed transition-all",
                    hasCustomImage
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300"
                        : "border-slate-300 hover:border-slate-400 dark:border-slate-600",
                    "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                )}
            >
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">
                    {hasCustomImage ? "Change custom image" : "Upload custom image"}
                </span>
            </button>
        </div>
    );
}
