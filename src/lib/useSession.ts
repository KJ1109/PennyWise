'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'

export function useSession() {
    const supabase = createSupabaseBrowser()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [hasBudget, setHasBudget] = useState(false)

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)

            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, monthly_budget')
                    .eq('id', session.user.id)
                    .maybeSingle()

                setHasBudget(!!data?.monthly_budget)
            }

            setLoading(false)
        }

        load()
    }, [])

    return { loading, user, hasBudget }
}
