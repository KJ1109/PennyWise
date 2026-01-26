'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'

export default function Onboarding() {
    const supabase = createClient()
    const router = useRouter()
    const [fullName, setFullName] = useState('')
    const [monthlyBudget, setMonthlyBudget] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: fullName,
                monthly_budget: parseFloat(monthlyBudget),
                updated_at: new Date().toISOString(),
            })

        if (error) {
            console.error('Error saving profile:', error)
            alert('Error saving profile!')
        } else {
            router.push('/')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white selection:bg-[#00ff41] selection:text-black">
            {/* Background Gradients/Glows (Optional, kept subtle) */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#00ff41]/5 blur-[120px]" />
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#00C896]/5 blur-[120px]" />

            <form
                onSubmit={handleSubmit}
                className="relative z-10 w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
            >
                <div className="text-center space-y-2">
                    <h1 className="font-serif text-3xl font-medium tracking-tight text-white">
                        Welcome
                    </h1>
                    <p className="text-sm text-gray-400">
                        Let's get your finance tracker set up.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#00C896]">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Karan"
                            className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all duration-300 hover:border-[#00C896]/50 focus:border-[#00C896] focus:bg-black focus:shadow-[0_0_20px_rgba(0,200,150,0.2)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Monthly Budget (₹)
                        </label>
                        <input
                            type="number"
                            required
                            value={monthlyBudget}
                            onChange={(e) => setMonthlyBudget(e.target.value)}
                            placeholder="e.g. 50000"
                            className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all duration-300 hover:border-[#00C896]/50 focus:border-[#00C896] focus:bg-black focus:shadow-[0_0_20px_rgba(0,200,150,0.2)]"
                        />
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="group relative w-full overflow-hidden rounded-md bg-gradient-to-r from-[#00C896] to-[#040404] py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,200,150,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? 'Saving Profile...' : 'Get Started'}
                        {!loading && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
                    </span>
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
            </form>
        </div>
    )
}
