'use client'

import React from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useInView } from 'react-intersection-observer'

interface TrendData {
    name: string
    contributions: number
    loans: number
}

// LIGHTHOUSE FIX 1.3: Deferred rendering using IntersectionObserver
export default function DashboardTrendChart({ data }: { data: TrendData[] }) {
    const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px 0px' })
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div ref={ref} className="h-[250px] w-full">
            {(!inView || !mounted) ? (
                <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />
            ) : (
                /* LIGHTHOUSE FIX 1.3: Explicit height to prevent forced reflows loop */
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLoan" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, '']}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Area
                            type="monotone"
                            dataKey="contributions"
                            name="Contributions"
                            stroke="#06b6d4"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorContrib)"
                        />
                        <Area
                            type="monotone"
                            dataKey="loans"
                            name="Loans"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorLoan)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}
