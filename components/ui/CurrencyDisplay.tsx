/**
 * CurrencyDisplay Component
 * 
 * A React component that enforces the "No Rounding Up" policy for displaying monetary values.
 * 
 * USAGE:
 * Replace all instances of:
 *   {amount.toFixed(2)} ❌
 *   {amount.toLocaleString()} ❌
 * 
 * With:
 *   <CurrencyDisplay amount={amount} /> ✅
 * 
 * @example
 * <CurrencyDisplay amount={100.999} /> // Displays: KES 100.99
 * <CurrencyDisplay amount={100.566} showSymbol={false} /> // Displays: 100.56
 */

import React from 'react';
import { formatMoney, truncateToDecimals } from '@/lib/currency';
import { Decimal } from 'decimal.js';

interface CurrencyDisplayProps {
    /** The monetary amount to display */
    amount: number | string | Decimal | null | undefined;

    /** Number of decimal places (default: 2) */
    decimals?: number;

    /** Whether to show currency symbol (default: true) */
    showSymbol?: boolean;

    /** Currency symbol (default: 'KES') */
    symbol?: string;

    /** Locale for formatting (default: 'en-KE') */
    locale?: string;

    /** Additional CSS classes */
    className?: string;

    /** Color for negative values (default: 'text-red-600') */
    negativeColor?: string;

    /** Color for positive values (default: 'text-green-600') */
    positiveColor?: string;

    /** Whether to color-code based on positive/negative (default: false) */
    colorCode?: boolean;
}

export function CurrencyDisplay({
    amount,
    decimals = 2,
    showSymbol = true,
    symbol = 'KES',
    locale = 'en-KE',
    className = '',
    negativeColor = 'text-red-600',
    positiveColor = 'text-green-600',
    colorCode = false
}: CurrencyDisplayProps) {
    // Handle null/undefined
    if (amount === null || amount === undefined) {
        return <span className={className}>-</span>;
    }

    // Truncate the value (NEVER round)
    const truncated = truncateToDecimals(amount, decimals);

    // Format the value
    const formatted = formatMoney(truncated, {
        decimals,
        includeSymbol: showSymbol,
        symbol,
        locale
    });

    // Determine color class
    let colorClass = '';
    if (colorCode) {
        colorClass = truncated < 0 ? negativeColor : truncated > 0 ? positiveColor : '';
    }

    return (
        <span className={`${className} ${colorClass}`.trim()}>
            {formatted}
        </span>
    );
}

/**
 * Compact currency display for large numbers
 * 
 * @example
 * <CurrencyDisplayCompact amount={1234567.89} /> // Displays: KES 1.23M
 */
export function CurrencyDisplayCompact({
    amount,
    showSymbol = true,
    symbol = 'KES',
    className = ''
}: Pick<CurrencyDisplayProps, 'amount' | 'showSymbol' | 'symbol' | 'className'>) {
    if (amount === null || amount === undefined) {
        return <span className={className}>-</span>;
    }

    const truncated = truncateToDecimals(amount, 2);
    const absValue = Math.abs(truncated);
    const sign = truncated < 0 ? '-' : '';

    let formatted: string;
    if (absValue >= 1_000_000_000) {
        formatted = `${sign}${truncateToDecimals(absValue / 1_000_000_000, 2)}B`;
    } else if (absValue >= 1_000_000) {
        formatted = `${sign}${truncateToDecimals(absValue / 1_000_000, 2)}M`;
    } else if (absValue >= 1_000) {
        formatted = `${sign}${truncateToDecimals(absValue / 1_000, 2)}K`;
    } else {
        formatted = `${sign}${truncateToDecimals(absValue, 2)}`;
    }

    return (
        <span className={className}>
            {showSymbol && `${symbol} `}{formatted}
        </span>
    );
}

/**
 * Currency input component with truncation on blur
 */
export function CurrencyInput({
    value,
    onChange,
    placeholder = '0.00',
    className = '',
    disabled = false,
    ...props
}: {
    value: number | string;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    [key: string]: any;
}) {
    const [displayValue, setDisplayValue] = React.useState(value?.toString() || '');

    React.useEffect(() => {
        setDisplayValue(value?.toString() || '');
    }, [value]);

    const handleBlur = () => {
        // Truncate on blur
        const truncated = truncateToDecimals(displayValue, 2);
        setDisplayValue(truncated.toString());
        onChange(truncated);
    };

    return (
        <input
            type="number"
            step="0.01"
            value={displayValue}
            onChange={(e) => setDisplayValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            {...props}
        />
    );
}
