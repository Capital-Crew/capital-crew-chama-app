"use client"

import React from "react"
import { SearchableSelect, Option } from "@/components/ui/searchable-select"
import { UserIcon } from "lucide-react"

interface MemberFilterProps {
    onMemberChange: (memberId: string) => void
    currentMemberId: string
}

export function MemberFilter({ onMemberChange, currentMemberId }: MemberFilterProps) {
    // Mock Data as requested by USER
    const mockMembers: Option[] = [
        { value: "mem_1", label: "Beatrice Kamau (#7)" },
        { value: "mem_2", label: "Biswel Macharia (#9)" },
        { value: "mem_3", label: "John Doe (#15)" },
        { value: "mem_4", label: "Mary Wanjiku (#22)" },
        { value: "mem_5", label: "Peter Maina (#45)" },
    ]

    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <UserIcon className="w-3 h-3" /> Borrower
            </label>
            <SearchableSelect
                options={mockMembers}
                value={currentMemberId}
                onChange={onMemberChange}
                placeholder="Select borrower..."
                emptyMessage="No borrower found."
                className="w-full"
            />
        </div>
    )
}
