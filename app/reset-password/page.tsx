'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/app/actions/password-reset';

import { Suspense } from 'react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // If no token is provided, redirect to forgot-password
    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setMessage(null);
        setError(null);

        const result = await resetPassword(formData);

        if (result.success) {
            setMessage(result.message || "Success");
            // Optional: auto-redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } else {
            setError(result.error || "Failed to reset password");
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
                        Capital Crew
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Set New Password
                    </p>
                </div>

                {message ? (
                    <div className="bg-green-50 border-2 border-green-500/20 text-green-700 px-6 py-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="flex items-center gap-2">
                            <span className="text-xl">🎉</span>
                            {message}
                        </p>
                        <p className="text-[10px] text-green-600 mt-2 uppercase tracking-widest font-black">
                            Redirecting to login...
                        </p>
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-6">
                        <input type="hidden" name="token" value={token || ""} />

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                New Password
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-black placeholder:text-slate-300 focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                Confirm New Password
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-black placeholder:text-slate-300 focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-shake">
                                {error}
                                {!token && (
                                    <div className="mt-2">
                                        <Link href="/forgot-password" title="Request new link" className="underline">
                                            Request a new link
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:bg-cyan-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? "Resetting..." : "Update Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
