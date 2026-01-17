'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { refreshMemberStats } from '@/app/actions/member-dashboard-actions';

export function RefreshButton({ memberId }: { memberId: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleRefresh = async () => {
        startTransition(async () => {
            // We can call a server action that revalidates
            await refreshMemberStats(memberId);
            // Or just router.refresh() if the data is fetched in page.tsx
            router.refresh();
        });
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2 text-gray-400 hover:text-cyan-600 transition-colors disabled:opacity-50"
            title="Refresh Data"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        </button>
    );
}
