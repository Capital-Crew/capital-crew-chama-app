import LoginForm from '@/components/login-form';

export default function LoginPage() {
    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: "url('/login-bg.png')" }}
        >
            {/* Optional Overlay for better text contrast if needed */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />

            <div className="w-full max-w-2xl p-12 relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100 drop-shadow-sm">Capital Crew</h1>
                    <p className="mt-3 text-lg text-blue-100 font-medium">Sign in to your account</p>
                </div>
                <div className="max-w-md mx-auto">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
