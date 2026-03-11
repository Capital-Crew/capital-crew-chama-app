'use client'

import React from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useInView } from 'react-intersection-observer'

interface TrendData {
    name: string
    contributions: number
    loans: number
}

// LIGHTHOUSE FIX 1.3: Deferred rendering using IntersectionObserver
export default function DashboardVolumeChart({ data }: { data: TrendData[] }) {
    const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px 0px' })

    return (
        <div ref={ref} className="h-[250px] w-full">
            {!inView ? (
                <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />
            ) : (
                /* LIGHTHOUSE FIX 1.3: Explicit height to prevent forced reflows loop */
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data}>
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
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, '']}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar
                            dataKey="contributions"
                            name="Inflow (Contributions)"
                            fill="#06b6d4"
                            radius={[4, 4, 0, 0]}
                            barSize={16}
                        />
                        <Bar
                            dataKey="loans"
                            name="Outflow (Loans)"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                            barSize={16}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}
