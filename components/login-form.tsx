'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // Importing z directly since we need to define schema
import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react'; // Client side signIn
import { useRouter } from 'next/navigation';

// We need to define schema here for client validation
const LoginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
});

type LoginSchemaType = z.infer<typeof LoginSchema>;

export default function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginSchemaType>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginSchemaType) => {
        setError(null);
        startTransition(async () => {
            try {
                // Using next-auth/react signIn for client-side
                const result = await signIn('credentials', {
                    email: data.email,
                    password: data.password,
                    redirect: false,
                });

                if (result?.error) {
                    setError("Invalid email or password");
                } else {
                    // Hard redirect to dashboard to ensure middleware re-runs / session updates
                    router.push('/dashboard');
                    router.refresh();
                }
            } catch (err) {
                setError("Something went wrong");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                </label>
                <div className="mt-1">
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        disabled={isPending}
                        {...register('email')}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'
                            }`}
                    />
                    {errors.email && (
                        <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                </label>
                <div className="mt-1">
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        disabled={isPending}
                        {...register('password')}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.password ? 'border-red-300' : 'border-gray-300'
                            }`}
                    />
                    {errors.password && (
                        <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                    )}
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Signing in...' : 'Sign in'}
                </button>
            </div>
        </form>
    );
}
