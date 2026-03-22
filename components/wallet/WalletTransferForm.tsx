/**
 * Example: Wallet Transfer Component
 * 
 * This is a reference implementation showing how to use the Payment Gateway
 * service from a UI component. You can adapt this for your specific needs.
 */

'use client';

import { useState } from 'react';
import { processTransfer } from '@/app/actions/process-transfer';
import type { DestinationType } from '@/lib/types';

interface WalletTransferFormProps {
    walletId: string;
    walletBalance: number;
    activeLoans?: Array<{
        id: string;
        loanApplicationNumber: string;
        productName: string;
        outstandingBalance: number;
    }>;
    memberId: string;
}

export function WalletTransferForm({
    walletId,
    walletBalance,
    activeLoans = [],
    memberId
}: WalletTransferFormProps) {
    const [destinationType, setDestinationType] = useState<DestinationType>('LOAN_REPAYMENT');
    const [destinationId, setDestinationId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const amountNum = parseFloat(amount);

            if (isNaN(amountNum) || amountNum <= 0) {
                throw new Error('Please enter a valid amount');
            }

            if (amountNum > walletBalance) {
                throw new Error('Insufficient wallet balance');
            }

            if (!destinationId) {
                throw new Error('Please select a destination');
            }

            const transferResult = await processTransfer({
                walletId,
                destinationType,
                destinationId: destinationType === 'CONTRIBUTION' ? memberId : destinationId,
                amount: amountNum,
                description: description || undefined
            });

            setResult(transferResult);
            setAmount('');
            setDescription('');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Wallet Transfer</h2>

            {}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                    KES {walletBalance.toLocaleString()}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transfer To
                    </label>
                    <select
                        value={destinationType}
                        onChange={(e) => {
                            setDestinationType(e.target.value as DestinationType);
                            setDestinationId('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="LOAN_REPAYMENT">Loan Repayment</option>
                        <option value="CONTRIBUTION">Share Contribution</option>
                    </select>
                </div>

                {}
                {destinationType === 'LOAN_REPAYMENT' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Loan
                        </label>
                        <select
                            value={destinationId}
                            onChange={(e) => setDestinationId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">-- Select a loan --</option>
                            {activeLoans.map((loan) => (
                                <option key={loan.id} value={loan.id}>
                                    {loan.loanApplicationNumber} - {loan.productName}
                                    (Balance: KES {loan.outstandingBalance.toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (KES)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a note..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Processing...' : 'Transfer Funds'}
                </button>
            </form>

            {}
            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">Error</p>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {}
            {result && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium mb-2">✓ {result.message}</p>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">New Wallet Balance:</span>
                            <span className="font-semibold">
                                KES {result.newWalletBalance.toLocaleString()}
                            </span>
                        </div>

                        {result.allocation && (
                            <>
                                <div className="border-t border-green-200 my-2 pt-2">
                                    <p className="font-medium text-gray-700 mb-1">Payment Allocation:</p>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Penalty:</span>
                                    <span>KES {result.allocation.penalty.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Interest:</span>
                                    <span>KES {result.allocation.interest.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Principal:</span>
                                    <span>KES {result.allocation.principal.toLocaleString()}</span>
                                </div>
                                {result.allocation.overpayment > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>Overpayment:</span>
                                        <span>KES {result.allocation.overpayment.toLocaleString()}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {result.journalEntryNumber && (
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>Journal Entry:</span>
                                <span className="font-mono">{result.journalEntryNumber}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
