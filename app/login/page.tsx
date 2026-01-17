import LoginForm from '@/components/login-form';

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <div className="w-full max-w-md p-8 relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">Capital Crew</h1>
                    <p className="mt-2 text-sm text-blue-200">Sign in to your account</p>
                </div>
                <LoginForm />
            </div>
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px]" />
                <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-sky-500/20 blur-[100px]" />
            </div>
        </div>
    );
}
