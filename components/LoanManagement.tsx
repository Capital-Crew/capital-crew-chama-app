
'use client'

import React, { useState, useMemo } from 'react';
import { Loan, Member, LoanProduct, LoanStatus, ApprovalStatus } from '@/lib/types';
import { PlusCircleIcon } from '@/components/icons';
import { formatCurrency, formatDate } from '@/lib/utils';
import { applyForLoan, submitVote, disburseLoan } from '@/app/actions';

interface LoanManagementProps {
    loans: (Loan & { member?: Member })[];
    members: Member[];
    products: LoanProduct[];
    currentUserId: string;
    userRole: string;
}

export function LoanManagement({ loans, members, products, currentUserId, userRole }: LoanManagementProps) {
    const [activeTab, setActiveTab] = useState<'application' | 'approvals' | 'disbursements'>('application');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const pendingApprovals = useMemo(() => loans.filter(l => l.status === LoanStatus.PENDING_APPROVAL), [loans]);
    const readyForPayout = useMemo(() => loans.filter(l => l.status === LoanStatus.ACTIVE && !l.disbursementDate), [loans]);

    const handleVote = async (loanId: string, decision: ApprovalStatus) => {
        await submitVote(loanId, decision, '', currentUserId);
    }

    const handleDisburse = async (loanId: string) => {
        await disburseLoan(loanId);
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Lending Operations</h2><p className="text-sm text-slate-500">Manage the complete lifecycle of group loans.</p></div>
                <button onClick={() => setIsModalOpen(true)} className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-cyan-600 transition-all flex items-center gap-2"><PlusCircleIcon className="w-5 h-5" /> New Application</button>
            </div>
            <div className="flex border-b border-slate-200">
                <TabButton label="Applications" active={activeTab === 'application'} onClick={() => setActiveTab('application')} />
                <TabButton label="Pending Approvals" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} count={pendingApprovals.length} />
                <TabButton label="Ready for Payout" active={activeTab === 'disbursements'} onClick={() => setActiveTab('disbursements')} count={readyForPayout.length} />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-4">App #</th>
                            <th className="px-6 py-4">Member</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                        {activeTab === 'application' && loans.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-400">{l.loanApplicationNumber}</td>
                                <td className="px-6 py-4 text-slate-900">{l.member?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 text-cyan-500">{formatCurrency(l.amount)}</td>
                                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-[8px] uppercase">{l.status}</span></td>
                                <td className="px-6 py-4 text-right italic text-slate-400">{formatDate(l.applicationDate)}</td>
                            </tr>
                        ))}
                        {activeTab === 'approvals' && pendingApprovals.map(l => {
                            const myVote = l.approvalVotes?.find(v => v.voterId === currentUserId);
                            return (
                                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-400">{l.loanApplicationNumber}</td>
                                    <td className="px-6 py-4 text-slate-900">{l.member?.name}</td>
                                    <td className="px-6 py-4 text-cyan-500">{formatCurrency(l.amount)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {l.approvalVotes?.map((v, i) => (<div key={i} className={`w-2 h-2 rounded-full ${v.decision === ApprovalStatus.APPROVED ? 'bg-green-500' : 'bg-red-500'}`} />))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!myVote && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleVote(l.id, ApprovalStatus.APPROVED)} className="bg-green-500 text-white px-3 py-1 rounded text-[8px] uppercase">Approve</button>
                                                <button onClick={() => handleVote(l.id, ApprovalStatus.REJECTED)} className="bg-red-500 text-white px-3 py-1 rounded text-[8px] uppercase">Reject</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {activeTab === 'disbursements' && readyForPayout.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-400">{l.loanApplicationNumber}</td>
                                <td className="px-6 py-4 text-slate-900">{l.member?.name}</td>
                                <td className="px-6 py-4 text-cyan-500">{formatCurrency(l.amount)}</td>
                                <td className="px-6 py-4"><span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[8px] uppercase">Approved</span></td>
                                <td className="px-6 py-4 text-right"><button onClick={() => handleDisburse(l.id)} className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[8px] uppercase">Confirm Payout</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-6">New Loan Application</h3>
                        <form action={async (formData) => {
                            const res = await applyForLoan(null, formData);
                            if (res?.error) alert(res.error);
                            else setIsModalOpen(false);
                        }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Member</label>
                                    <select name="memberId" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black">
                                        <option value="">Select...</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Product</label>
                                    <select name="loanProductId" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black">
                                        <option value="">Select...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Capital (KES)</label>
                                    <input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Contract Ref</label>
                                    <input name="contractRef" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Submit Application</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-center text-xs font-bold text-slate-400 mt-2">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const TabButton: React.FC<{ label: string, active: boolean, onClick: () => void, count?: number }> = ({ label, active, onClick, count }) => (
    <button onClick={onClick} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2 ${active ? 'text-cyan-500 border-cyan-500' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
        {label} {count !== undefined && count > 0 && <span className="ml-2 bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded-full text-[8px]">{count}</span>}
    </button>
);
