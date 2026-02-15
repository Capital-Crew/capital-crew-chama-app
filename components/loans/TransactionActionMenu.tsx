'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reverseLoanTransaction } from '@/app/actions/loan-reversal-actions';
import { AlertTriangle, RotateCcw, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionActionMenuProps {
    transactionId: string;
    isReversed?: boolean;
}

export function TransactionActionMenu({ transactionId, isReversed }: TransactionActionMenuProps) {
    const [isThinking, setIsThinking] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleReverse = async () => {
        setIsThinking(true);
        setError('');

        try {
            const result = await reverseLoanTransaction(transactionId, 'Manual Reversal');
            if (result.error) {
                setError(result.error);
                toast.error(result.error);
            } else {
                setShowModal(false);
                toast.success('Transaction reversed successfully. Dashboard updated.');
                router.refresh();
            }
        } catch (e) {
            setError('An unexpected error occurred.');
            toast.error('An unexpected error occurred.');
        } finally {
            setIsThinking(false);
        }
    };

    if (isReversed) {
        return (
            <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-amber-200">
                <AlertTriangle className="w-4 h-4" />
                Transaction Reversed
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-bold transition-colors"
            >
                <RotateCcw className="w-4 h-4" />
                Reverse Transaction
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-red-50 border-b border-red-100 p-4 flex justify-between items-center">
                            <h3 className="font-bold text-red-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                Confirm Reversal
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-red-400 hover:text-red-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && <p className="text-red-600 text-xs mt-1 font-medium">{error}</p>}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg"
                                    disabled={isThinking}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReverse}
                                    className="px-4 py-2 bg-red-600 text-white font-bold text-sm hover:bg-red-700 rounded-lg shadow-lg shadow-red-500/20 flex items-center gap-2"
                                    disabled={isThinking}
                                >
                                    {isThinking && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirm Reversal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
