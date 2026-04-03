"use client"

import React, { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getCroppedImg } from "@/lib/image-utils"
import { Loader2, ZoomIn, Scissors } from 'lucide-react'

interface ImageCropperModalProps {
    image: string | null
    isOpen: boolean
    onClose: () => void
    onCropComplete: (croppedBlob: Blob) => void
}

export function ImageCropperModal({ image, isOpen, onClose, onCropComplete }: ImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleConfirm = async () => {
        if (!image || !croppedAreaPixels) return

        setIsProcessing(true)
        try {
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
            if (croppedBlob) {
                onCropComplete(croppedBlob)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsProcessing(false)
        }
    }

    if (!image) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-900 border-slate-800">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-white flex items-center gap-2 uppercase tracking-tighter italic font-black">
                        <Scissors className="w-5 h-5 text-blue-400" /> Adjust Profile Photo
                    </DialogTitle>
                </DialogHeader>

                <div className="relative h-[400px] w-full mt-4 bg-slate-950">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1 / 1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                        showGrid={true}
                        cropShape="round"
                    />
                </div>

                <div className="px-6 py-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <ZoomIn className="w-4 h-4 text-slate-400" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-900/50 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-8"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Apply Crop"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
