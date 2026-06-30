import { useState } from 'react';
import { Mail, Lock, KeyRound, ArrowRight, Activity, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { signIn, signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import bgImage from '../../assets/background.png';
import logoImage from '../../assets/icon.png';

export default function AuthLayout({ onLoginSuccess }) {
    const [view, setView] = useState('login'); // 'login' | 'register' | 'otp'
    const [isLoading, setIsLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleAction = async (e, action) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            if (action === 'login') {
                if (!email || !password) {
                    setErrorMsg('Please enter both email and password');
                    setIsLoading(false);
                    return;
                }
                await signIn({ username: email, password });
                onLoginSuccess();
            } else if (action === 'register') {
                if (password !== confirmPassword) {
                    setErrorMsg('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                await signUp({
                    username: email,
                    password,
                    options: { userAttributes: { email } }
                });
                setView('otp');
            } else if (action === 'otp') {
                await confirmSignUp({ username: email, confirmationCode: otpCode });
                setView('login');
            }
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            await resendSignUpCode({ username: email });
            setErrorMsg('');
            alert('Verification code resent successfully. Please check your email!');
        } catch (err) {
            setErrorMsg(err.message || 'Failed to resend code. Please try again.');
        }
    };

    return (
        <div
            className="h-screen w-screen flex flex-col md:flex-row bg-[#F8FAFC] overflow-hidden text-slate-800 bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
        >

            {/* Left side: Branding */}
            <div className="hidden md:flex flex-col flex-1 p-10 lg:p-20 justify-center items-start relative overflow-hidden bg-white/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent pointer-events-none" />

                <div className="relative z-10 w-full mb-12">
                    <div className="flex items-center space-x-5 mb-10">
                        <img src={logoImage} alt="VSmart Logo" className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 object-contain drop-shadow-[0_0_35px_rgba(249,115,22,0.3)]" />
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight drop-shadow-sm">
                            VSmart
                        </h1>
                    </div>

                    <div className="max-w-md">
                        <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4 text-slate-900 tracking-tight drop-shadow-sm">
                            Real-time <br /> Asset Tracking <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                                Data Streaming
                            </span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* Right side: Auth Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 relative z-10 overflow-y-auto bg-white/40 backdrop-blur-lg border-l border-slate-200/50">
                <div className="w-full max-w-[400px] bg-white/90 backdrop-blur-3xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">

                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                            {view === 'login' && 'Sign in to your account'}
                            {view === 'register' && 'Create an account'}
                            {view === 'otp' && 'Verify your account'}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                            {view === 'login' && 'Enter your email and password to access'}
                            {view === 'register' && 'Set up your fleet management workspace'}
                            {view === 'otp' && `We just sent a 6-digit code to ${email}`}
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start space-x-2 shadow-sm">
                            <AlertCircleIcon />
                            <span className="break-words font-medium">{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={(e) => handleAction(e, view)} className="space-y-4">
                        {(view === 'login' || view === 'register') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>
                        )}

                        {(view === 'login' || view === 'register') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {view === 'login' && (
                                    <div className="flex justify-end mt-2">
                                        <button type="button" className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors">
                                            Forgot password?
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'register' && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-semibold text-slate-600 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        {view === 'otp' && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 text-center">
                                <label className="text-xs font-semibold text-slate-600 mb-2 block">6-digit verification code</label>
                                <div className="relative max-w-[200px] mx-auto">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-slate-50/80 border border-orange-500/30 text-slate-800 text-lg font-mono tracking-[0.25em] text-center rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
                                        placeholder="000000"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-6 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                        >
                            <span>
                                {isLoading ? 'Processing...' :
                                    view === 'login' ? 'Sign in' :
                                        view === 'register' ? 'Sign up' : 'Verify Code'}
                            </span>
                            {!isLoading && <ArrowRight className="w-5 h-5 opacity-80" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-100 pt-6">
                        {view === 'login' ? (
                            <p className="text-sm text-slate-500 font-medium">
                                Don't have an account?{' '}
                                <button onClick={() => setView('register')} className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                                    Sign up now
                                </button>
                            </p>
                        ) : view === 'register' ? (
                            <p className="text-sm text-slate-500 font-medium">
                                Already have an account?{' '}
                                <button onClick={() => setView('login')} className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                                    Back to sign in
                                </button>
                            </p>
                        ) : (
                            <p className="text-sm text-slate-500 font-medium">
                                Didn't receive a code?{' '}
                                <button onClick={handleResendOTP} className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                                    Resend code
                                </button>
                                {' '}or{' '}
                                <button onClick={() => setView('register')} className="text-slate-400 underline hover:text-slate-500 transition-colors">
                                    Cancel
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const AlertCircleIcon = () => (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);
