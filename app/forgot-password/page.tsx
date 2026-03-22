'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions/password-reset';

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setMessage(null);
        setError(null);

        const result = await requestPasswordReset(formData);

        if (result.success) {
            setMessage(result.message || "Success");
        } else {
            setError(result.error || "Failed to process request");
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
                        Capital Crew
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Reset Your Password
                    </p>
                </div>

                {message ? (
                    <div className="bg-green-50 border-2 border-green-500/20 text-green-700 px-6 py-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="flex items-center gap-2">
                            <span className="text-xl">✅</span>
                            {message}
                        </p>
                        <div className="mt-4 pt-4 border-t border-green-500/10">
                            <Link href="/login" className="text-[10px] uppercase tracking-widest text-green-700 hover:underline">
                                Return to Login
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                Email Address
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="Enter your registered email"
                                className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-black placeholder:text-slate-300 focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:bg-cyan-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? "Sending link..." : "Send Reset Link"}
                        </button>

                        <div className="text-center pt-2">
                            <Link href="/login" className="text-xs font-black text-slate-400 hover:text-cyan-500 transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
