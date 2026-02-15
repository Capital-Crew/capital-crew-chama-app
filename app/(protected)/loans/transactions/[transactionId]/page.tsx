
import { getLoanTransactionDetails } from '@/app/actions/loan';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { GLEntriesTable } from '@/components/loans/GLEntriesTable';
import { TransactionActionMenu } from '@/components/loans/TransactionActionMenu';
import { LoanTransaction } from '@/lib/types/loan-transaction';

interface PageProps {
    params: Promise<{ transactionId: string }>;
}

export default async function TransactionDetailsPage({ params }: PageProps) {
    const { transactionId } = await params;
    const transaction = await getLoanTransactionDetails(transactionId);

    if (!transaction) {
        return notFound();
    }

    const { loan } = transaction;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-500">
                <Link href={`/loans/${loan?.id}`} className="hover:text-teal-600 hover:underline">
                    &larr; Back to Loan {loan?.loanApplicationNumber}
                </Link>
                <span className="mx-2">/</span>
                <span className="font-semibold text-slate-700">Transaction Details</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Transaction #{transaction.id}
                        </h1>
                        {transaction.isReversed && (
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">
                                Reversed
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500">
                        Posted on {format(new Date(transaction.postingDate || transaction.createdAt), 'dd MMM yyyy HH:mm')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <TransactionActionMenu
                        transactionId={transaction.id}
                        isReversed={transaction.isReversed}
                    />
                </div>
            </div>

            {/* Metadata Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Type</p>
                    <p className="font-mono text-sm text-slate-900 font-semibold">{transaction.entryType || transaction.type}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Amount</p>
                    <p className="font-mono text-sm text-slate-900 font-semibold">
                        {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(transaction.amount)}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Reference</p>
                    <p className="font-mono text-sm text-slate-900">{transaction.reference || transaction.referenceId || transaction.externalReferenceId || '-'}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Initiated By</p>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {transaction.user?.name ? transaction.user.name.substring(0, 2).toUpperCase() : 'SY'}
                        </div>
                        <p className="text-sm text-slate-900 truncate max-w-[120px]">
                            {transaction.user?.name || 'System'}
                        </p>
                    </div>
                </div>
                <div className="col-span-2 md:col-span-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Description</p>
                    <p className="text-sm text-slate-700 italic">
                        "{transaction.description}"
                    </p>
                </div>
            </div>

            {/* GL Entries Table */}
            <GLEntriesTable entries={transaction.glEntries || []} />
        </div>
    );
}
