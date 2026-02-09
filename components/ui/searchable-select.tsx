"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface Option {
    value: string
    label: string
}

interface SearchableSelectProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    className?: string
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    emptyMessage = "No item found.",
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-white border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm h-11",
                        className
                    )}
                >
                    <span className="truncate">
                        {value
                            ? options.find((option) => option.value === value)?.label
                            : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                <Command>
                    <CommandInput placeholder={`Search...`} />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value === value ? "" : option.value)
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer pointer-events-auto"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-cyan-500 transition-opacity",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="truncate">{option.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
