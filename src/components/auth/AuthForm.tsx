'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, CheckCircle2, XCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Capacitor } from '@capacitor/core'

export function AuthForm() {
    const router = useRouter()
    const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Form Data
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // UI State
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Validation States
    const [isUsernameChecking, setIsUsernameChecking] = useState(false)
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [passwordsMatch, setPasswordsMatch] = useState(true)

    // Debounce Username Check
    useEffect(() => {
        if (mode !== 'register' || !username || username.length < 3) return

        const timer = setTimeout(async () => {
            setIsUsernameChecking(true)
            const supabase = createSupabaseBrowser()

            const { data } = await supabase
                .from('profiles')
                .select('id')
                .ilike('full_name', username) // Case insensitive check
                .maybeSingle()

            setUsernameAvailable(!data)
            setIsUsernameChecking(false)
        }, 800)

        return () => clearTimeout(timer)
    }, [username, mode])

    useEffect(() => {
        if (mode === 'register') {
            setPasswordsMatch(password === confirmPassword || confirmPassword === '')
        }
    }, [password, confirmPassword, mode])

    const handleGoogleLogin = async () => {
        const supabase = createSupabaseBrowser()

        const getRedirectUrl = () => {
            const isNative = Capacitor.isNativePlatform()
            console.log("Is native:", isNative)

            if (isNative) {
                const url = 'pennywise://auth-callback?next=/dashboard'
                console.log("RedirectTo:", url)
                return url
            }
            // Web: Redirect to Server-Side Route for Cookie Exchange
            const url = `${window.location.origin}/auth/callback?next=/dashboard`
            console.log("RedirectTo:", url)
            return url
        }

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: getRedirectUrl(),
            },
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)
        setLoading(true)

        const supabase = createSupabaseBrowser()

        try {
            if (mode === 'login') {
                // Try 1: As Email (default)
                let { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })

                // Try 2: As Username (if failed and looks like username)
                if (signInError && !email.includes('@')) {
                    const dummyEmail = `${email.toLowerCase().replace(/\s+/g, '')}@finance.com`
                    const { error: retryError } = await supabase.auth.signInWithPassword({
                        email: dummyEmail,
                        password
                    })
                    if (!retryError) {
                        signInError = null // Success on retry
                    }
                }

                if (signInError) throw signInError

                router.refresh()
                router.push('/dashboard')
            } else if (mode === 'forgot_password') {
                // Forgot Password Flow
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
                })

                if (resetError) throw resetError
                setSuccessMessage('Password recovery link sent! Check your email.')
            } else {
                // Register
                if (!passwordsMatch) {
                    throw new Error("Passwords do not match")
                }
                if (usernameAvailable === false) {
                    throw new Error("Username is taken")
                }

                // 1. SignUp
                let finalEmail = email
                if (!finalEmail) {
                    // Should be strictly prevented by 'required' attribute, but validation here:
                    if (!email.includes('@') && !email.includes('.')) {
                        // Support for pure username registration (legacy support or if user insists on username only)
                        // User specifically asked to make email Compulsory.
                        throw new Error("Email is required for registration.")
                    }
                }

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email: finalEmail,
                    password,
                    options: {
                        data: {
                            full_name: username,
                        }
                    }
                })

                if (signUpError) throw signUpError

                // 2. Alert
                alert('Registration successful!')
                setMode('login')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md ring-1 ring-white/5">
            {/* Header */}
            <div className="text-center">
                <div className="flex justify-center mb-6">
                    <img src="/logo.png" alt="Pennywise" className="h-32 w-auto object-contain drop-shadow-[0_0_20px_rgba(0,200,150,0.6)]" />
                </div>
                <h1 className="font-serif text-4xl text-white tracking-tight mb-6">Pennywise</h1>

                {/* Toggle Switch */}
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1 border border-white/10">
                    <div
                        role="button"
                        onClick={() => {
                            setMode('login')
                            setError(null)
                            setSuccessMessage(null)
                        }}
                        className={cn(
                            "flex items-center justify-center rounded-md py-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer select-none",
                            mode === 'login' || mode === 'forgot_password'
                                ? "bg-gradient-to-r from-[#00C896] to-[#040404] text-white shadow-[0_0_20px_rgba(0,200,150,0.4)]"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Login
                    </div>
                    <div
                        role="button"
                        onClick={() => {
                            setMode('register')
                            setError(null)
                            setSuccessMessage(null)
                        }}
                        className={cn(
                            "flex items-center justify-center rounded-md py-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer select-none",
                            mode === 'register'
                                ? "bg-gradient-to-r from-[#00C896] to-[#040404] text-white shadow-[0_0_20px_rgba(0,200,150,0.4)]"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Register
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-4">
                    {mode === 'register' && (
                        <div className="group relative">
                            <label className="mb-1 block text-xs font-mono font-medium text-gray-400 uppercase tracking-wider">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value)
                                    setUsernameAvailable(null)
                                }}
                                className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-4 pr-10 text-sm text-white placeholder-gray-500 focus:border-[#00ff41]/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#00ff41]/30 transition-all font-mono"
                                placeholder="username"
                            />
                            {/* Availability Indicator */}
                            <div className="absolute right-3 top-[34px]">
                                {isUsernameChecking ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                ) : username && username.length >= 3 ? (
                                    usernameAvailable ? (
                                        <CheckCircle2 className="h-4 w-4 text-[#00ff41]" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )
                                ) : null}
                            </div>
                        </div>
                    )}


                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {mode === 'login' ? 'Email or Username' : (mode === 'forgot_password' ? 'Enter your Registered Email' : 'Email (Required)')}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder={mode === 'login' ? "username or email" : "name@example.com"}
                            className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 hover:border-[#00C896]/50 hover:bg-white/10 focus:border-[#00C896] focus:bg-black focus:shadow-[0_0_20px_rgba(0,200,150,0.3)]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {mode !== 'forgot_password' && (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Password
                                </label>
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('forgot_password');
                                            setError(null);
                                            setSuccessMessage(null);
                                        }}
                                        className="text-[10px] text-[#00C896] hover:text-[#00C896]/80 transition-colors uppercase font-bold tracking-wider"
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••"
                                    className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 hover:border-[#00C896]/50 hover:bg-white/10 focus:border-[#00C896] focus:bg-black focus:shadow-[0_0_20px_rgba(0,200,150,0.3)] [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'register' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={cn(
                                        "w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 hover:border-[#00C896]/50 hover:bg-white/10 focus:border-[#00C896] focus:bg-black focus:shadow-[0_0_20px_rgba(0,200,150,0.3)] [&::-ms-reveal]:hidden [&::-ms-clear]:hidden",
                                        !passwordsMatch && "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                                    )}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md bg-red-500/10 p-3 text-center text-xs text-red-500 border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="rounded-md bg-green-500/10 p-3 text-center text-xs text-[#00C896] border border-[#00C896]/20">
                            {successMessage}
                        </div>
                    )}

                </div>
                <button
                    type="submit"
                    disabled={loading || (mode === 'register' && (!usernameAvailable || !passwordsMatch))}
                    className="group relative w-full overflow-hidden rounded-md bg-gradient-to-r from-[#00C896] to-[#040404] py-3 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,200,150,0.6)] disabled:opacity-50"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? 'Processing...' : (mode === 'login' ? 'Login' : (mode === 'forgot_password' ? 'Send Reset Link' : 'Create Account'))}
                        {!loading && <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />}
                    </span>
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>

                {mode === 'forgot_password' && (
                    <button
                        type="button"
                        onClick={() => {
                            setMode('login');
                            setError(null);
                            setSuccessMessage(null);
                        }}
                        className="w-full text-center text-xs text-gray-500 hover:text-white transition-colors mt-2"
                    >
                        Back to Login
                    </button>
                )}
            </form>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#050505] px-2 text-gray-500 font-mono">Or connect via</span>
                </div>
            </div>

            {/* Google Login */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all font-sans"
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Sign in with Google
            </button>
        </div>
    )
}
