export type RiskBucket = 'Current' | 'Watch' | 'Substandard' | 'Doubtful/Loss'

export function getRiskBucket(daysLate: number): RiskBucket {
    if (daysLate <= 0) return 'Current'
    if (daysLate <= 30) return 'Watch'
    if (daysLate <= 90) return 'Substandard'
    return 'Doubtful/Loss'
}

export function getRiskBucketColor(bucket: RiskBucket): string {
    switch (bucket) {
        case 'Current': return 'bg-emerald-100 text-emerald-700'
        case 'Watch': return 'bg-amber-100 text-amber-700'
        case 'Substandard': return 'bg-orange-100 text-orange-700'
        case 'Doubtful/Loss': return 'bg-rose-100 text-rose-700'
        default: return 'bg-slate-100 text-slate-700'
    }
}
