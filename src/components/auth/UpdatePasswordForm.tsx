'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function UpdatePasswordForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordsMatch, setPasswordsMatch] = useState(true)

    useEffect(() => {
        setPasswordsMatch(password === confirmPassword || confirmPassword === '')
    }, [password, confirmPassword])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)
        setLoading(true)

        try {
            if (!passwordsMatch) throw new Error("Passwords do not match")
            if (password.length < 6) throw new Error("Password must be at least 6 characters")

            const supabase = createClient()
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            })

            if (updateError) throw updateError

            setSuccessMessage("Password updated successfully!")

            // Wait a moment then redirect to login or dashboard
            setTimeout(() => {
                router.push('/')
            }, 2000)

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
                <h1 className="font-serif text-2xl text-white tracking-tight mb-2">Reset Password</h1>
                <p className="text-gray-400 text-sm">Enter your new password below.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-4">

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            New Password
                        </label>
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

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Confirm New Password
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
                    disabled={loading || !passwordsMatch || !password}
                    className="group relative w-full overflow-hidden rounded-md bg-gradient-to-r from-[#00C896] to-[#040404] py-3 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,200,150,0.6)] disabled:opacity-50"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? 'Updating...' : 'Update Password'}
                        {!loading && <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />}
                    </span>
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
            </form>
        </div>
    )
}
