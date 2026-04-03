import { useState, useRef } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { User, Mail, Phone, Wallet, PiggyBank, Receipt, Camera, Edit2, Check, X, Loader2 } from 'lucide-react'
import { useFormAction } from '@/hooks/useFormAction'
import { updateMemberProfile } from '@/app/actions/member-actions'
import { toast } from 'sonner'
import { ImageCropperModal } from '@/components/shared/ImageCropperModal'
import { useRouter } from 'next/navigation'

interface MemberQuickStatsProps {
    memberId: string
    stats: {
        identity: {
            firstName: string
            lastName: string
            fullName: string
            memberNumber: number
            status: string
            email?: string
            phone?: string
            image?: string
        }
        financials: {
            memberSavings?: number
            contributions?: number
            cumulativeContributions?: number
            outstandingLoans?: number
        }
    }
    onViewLoans?: () => void
}

export function MemberQuickStats({ memberId, stats, onViewLoans }: MemberQuickStatsProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({
        email: stats.identity.email || '',
        mobile: stats.identity.phone || ''
    })

    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isCropperOpen, setIsCropperOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const { execute, isPending } = useFormAction()

    const handleSave = async () => {
        const res = await execute(updateMemberProfile({
            memberId,
            email: editData.email,
            mobile: editData.mobile
        }))

        if (res.success) {
            toast.success("Profile updated successfully")
            setIsEditing(false)
        } else {
            toast.error(res.error || "Failed to update profile")
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Basic frontend validation (Detailed validation on backend)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Original image must be less than 5MB")
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setSelectedImage(reader.result as string)
            setIsCropperOpen(true)
        }
        reader.readAsDataURL(file)

        // Reset input
        e.target.value = ''
    }

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsCropperOpen(false)
        setIsUploading(true)

        const formData = new FormData()
        formData.append('file', croppedBlob, 'profile.jpg')
        formData.append('memberId', memberId)

        try {
            const res = await fetch('/api/upload/profile-picture', {
                method: 'POST',
                body: formData
            })

            const result = await res.json()

            if (result.success) {
                toast.success("Profile picture updated and optimized")
                router.refresh()
            } else {
                toast.error(result.error || "Upload failed")
            }
        } catch (error) {
            toast.error("Connection error during upload")
        } finally {
            setIsUploading(false)
            setSelectedImage(null)
        }
    }

    const memberSavings = stats.financials.memberSavings ?? 0
    const contributions = stats.financials.cumulativeContributions ?? stats.financials.contributions ?? 0
    const outstandingLoans = stats.financials.outstandingLoans ?? 0

    const initials = `${stats.identity.firstName[0]}${stats.identity.lastName[0]}`

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 w-full max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12">
                
                {/* Left Section: Profile Picture/Upload */}
                <div className="flex flex-col items-center justify-start lg:w-1/3 gap-4">
                    <div 
                        className="relative group cursor-pointer"
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        
                        <div className={cn(
                            "h-48 w-48 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50/30",
                            stats.identity.image && "border-solid border-slate-100"
                        )}>
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    <span className="text-[10px] font-bold text-blue-600 uppercase">Uploading...</span>
                                </div>
                            ) : stats.identity.image ? (
                                <img src={stats.identity.image} alt={stats.identity.fullName} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-5xl font-black text-slate-300 group-hover:text-blue-500 transition-colors uppercase italic">
                                    {initials}
                                </span>
                            )}
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <div className="bg-white/90 p-3 rounded-full shadow-lg">
                                    <Camera className="w-6 h-6 text-slate-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-900 uppercase italic">Upload Picture</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">JPG, PNG OR GIF (MAX 2MB)</p>
                    </div>
                </div>

                {/* Right Section: Member Details */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                            Member Details
                        </h3>
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
                            >
                                <Edit2 className="w-3 h-3" /> EDIT DETAILS
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    disabled={isPending}
                                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    <X className="w-3 h-3" /> CANCEL
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-1.5 rounded-full shadow-sm shadow-blue-100 disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    SAVE CHANGES
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Detail Rows */}
                        <DetailRow label="Full Name" value={stats.identity.fullName} />
                        
                        <DetailRow 
                            label="Phone Number" 
                            value={stats.identity.phone || 'N/A'} 
                            isEditing={isEditing}
                            type="text"
                            onEdit={(val) => setEditData({...editData, mobile: val})}
                            editValue={editData.mobile}
                        />

                        <DetailRow 
                            label="Email Address" 
                            value={stats.identity.email || 'N/A'} 
                            isEditing={isEditing}
                            type="email"
                            onEdit={(val) => setEditData({...editData, email: val})}
                            editValue={editData.email}
                        />

                        <DetailRow label="Wallet ID" value={`WAL-${stats.identity.memberNumber}`} />
                        <DetailRow label="Member ID" value={`#${stats.identity.memberNumber}`} />
                        
                        <div className="pt-4 mt-4 border-t border-slate-50 space-y-4">
                            <DetailRow 
                                label="Member Savings" 
                                value={formatCurrency(memberSavings)} 
                                subValue="Available Wallet Balance"
                                valueColor="text-blue-600"
                            />
                            <DetailRow 
                                label="Contributions" 
                                value={formatCurrency(contributions)} 
                                subValue="Total Share Contributions"
                                valueColor="text-emerald-600"
                            />
                            <DetailRow 
                                label="Outstanding Loans" 
                                value={formatCurrency(outstandingLoans)} 
                                subValue="Current Debt Load"
                                valueColor="text-orange-600"
                                isLink
                                onClick={onViewLoans}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ImageCropperModal 
                image={selectedImage}
                isOpen={isCropperOpen}
                onClose={() => {
                    setIsCropperOpen(false)
                    setSelectedImage(null)
                }}
                onCropComplete={handleCropComplete}
            />
        </div>
    )
}

function DetailRow({ 
    label, 
    value, 
    subValue, 
    valueColor = "text-slate-900", 
    isEditing, 
    onEdit, 
    editValue,
    type = "text",
    isLink,
    onClick 
}: { 
    label: string, 
    value: string, 
    subValue?: string, 
    valueColor?: string,
    isEditing?: boolean,
    onEdit?: (val: string) => void,
    editValue?: string,
    type?: string,
    isLink?: boolean,
    onClick?: () => void
}) {
    return (
        <div className="flex items-start justify-between group py-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-1">{label}</span>
            <div className="text-right flex flex-col items-end">
                {isEditing && onEdit ? (
                    <input 
                        type={type}
                        value={editValue}
                        onChange={(e) => onEdit(e.target.value)}
                        className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400 min-w-[200px]"
                    />
                ) : (
                    <span 
                        onClick={isLink ? onClick : undefined}
                        className={cn(
                            "text-sm font-black tracking-tight",
                            valueColor,
                            isLink && "hover:underline cursor-pointer"
                        )}
                    >
                        {value}
                    </span>
                )}
                {subValue && <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{subValue}</span>}
            </div>
        </div>
    )
}
