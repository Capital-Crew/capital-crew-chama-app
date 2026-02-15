import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, otherwise standard string interpolation

interface MoneyProps {
    amount: number | string | null | undefined;
    colored?: boolean;
    bold?: boolean;
    className?: string; // Allow extra styling overrides
}

export function Money({ amount, colored = false, bold = false, className }: MoneyProps) {
    const numericValue = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
    const isNegative = !isNaN(numericValue) && numericValue < 0;
    const isPositive = !isNaN(numericValue) && numericValue > 0;

    return (
        <span
            className={cn(
                "font-mono whitespace-nowrap", // Monospace for alignment, prevent wrap
                bold && "font-bold",
                colored && isNegative && "text-red-600",
                colored && isPositive && "text-emerald-600",
                className
            )}
        >
            {formatCurrency(amount)}
        </span>
    );
}
