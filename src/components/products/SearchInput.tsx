'use client'

import { Search, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

export function SearchInput({ initialQuery = '', initialPincode = '' }: { initialQuery?: string, initialPincode?: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(initialQuery)
    const [pincode, setPincode] = useState(initialPincode)
    const [isPending, startTransition] = useTransition()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        startTransition(() => {
            const params = new URLSearchParams(searchParams)
            params.set('q', query)
            if (pincode) params.set('pincode', pincode)
            else params.delete('pincode')
            router.replace(`/products?${params.toString()}`)
        })
    }

    return (
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8 relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full rounded-full border border-input bg-card py-4 pl-12 pr-4 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            <input
                placeholder="Pincode"
                className="absolute right-16 top-1/2 -translate-y-1/2 w-24 rounded-full border border-input bg-muted py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <button
                type="submit"
                disabled={isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </button>
        </form>
    )
}
