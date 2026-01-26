'use client'

import { Search, MapPin } from 'lucide-react'

interface SearchInputProps {
    value: string
    onChange: (val: string) => void
    category: string
    onCategoryChange: (val: string) => void
    pincode: string
    onPincodeChange: (val: string) => void
    onSearch: () => void
    loading: boolean
}

const CATEGORIES = ['All', 'Electronics', 'Stationery', 'Fashion', 'Beauty', 'Groceries']

export function SearchInput({
    value, onChange,
    category, onCategoryChange,
    pincode, onPincodeChange,
    onSearch, loading
}: SearchInputProps) {
    return (
        <div className="mb-8 w-full max-w-3xl space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
                {/* Category Select */}
                <select
                    value={category}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="h-12 rounded-lg border border-gray-300 bg-white px-4 text-sm focus:border-blue-500 focus:outline-none"
                >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Pincode Input */}
                <div className="relative w-32 shrink-0">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={pincode}
                        onChange={(e) => onPincodeChange(e.target.value)}
                        className="h-12 w-full rounded-lg border border-gray-300 pl-9 pr-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Pincode"
                        maxLength={6}
                    />
                </div>

                {/* Main Search */}
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                        className="h-12 w-full rounded-lg border border-gray-300 pl-10 pr-24 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Search products..."
                    />
                    <button
                        onClick={onSearch}
                        disabled={loading}
                        className="absolute bottom-1 right-1 top-1 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>
        </div>
    )
}
