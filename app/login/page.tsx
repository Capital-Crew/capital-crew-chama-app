import LoginForm from '@/components/login-form';

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">Capital Crew</h1>
                    <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
