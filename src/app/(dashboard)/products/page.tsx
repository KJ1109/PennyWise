'use client'

import { useState } from 'react'
// import { searchProductsAction } from '@/app/actions/search' // Server Action removed
import { type Product } from '@/lib/search'
import { SearchInput } from '@/components/products/SearchInput'
import { ProductCard } from '@/components/products/ProductCard'
import { Search, ShoppingBag } from 'lucide-react'

// Dummy type if needed, or import from lib if it still exists
// import { type Product } from '@/lib/search' 

export default function ProductsPage() {
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState('All')
    const [pincode, setPincode] = useState('')

    const [results, setResults] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [isGroceryFallback, setIsGroceryFallback] = useState(false)

    const handleSearch = async () => {
        if (!query.trim()) return
        setLoading(true)
        setHasSearched(true)
        setIsGroceryFallback(false)
        setResults([]) // Clear previous

        try {
            // Client-side adaptation: Server Actions are not supported in SPA export.
            // const { products, isGroceryFallback: isFallback } = await searchProductsAction(query, category, pincode)
            // setResults(products)
            // setIsGroceryFallback(isFallback)

            /* 
               TODO: Implement client-side search API or 3rd party integration here.
               For now, we disable this feature to ensure the build passes.
            */
            console.warn("Search disabled: Server Actions not supported in SPA.")
            alert("Price comparison search is currently unavailable in the offline version.")

        } catch (error) {
            console.error(error)
            alert("Failed to fetch products")
        } finally {
            setLoading(false)
        }
    }

    // Determine lowest price
    const minPrice = results.length > 0 ? Math.min(...results.map(p => p.price)) : 0

    return (
        <main className="flex-1 w-full min-h-screen flex flex-col items-center p-4 pt-8 pb-24 md:p-8">
            <div className="mb-6 text-center">
                <h1 className="mb-2 text-3xl font-bold text-gray-900">Price Comparison</h1>
                <p className="text-gray-500">Find the best deals across the web.</p>
            </div>

            <SearchInput
                value={query} onChange={setQuery}
                category={category} onCategoryChange={setCategory}
                pincode={pincode} onPincodeChange={setPincode}
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Grocery Fallback UI */}
            {isGroceryFallback ? (
                <div className="mt-8 flex w-full max-w-2xl flex-col items-center rounded-xl border border-orange-100 bg-orange-50 p-8 text-center">
                    <ShoppingBag className="mb-4 h-12 w-12 text-orange-500" />
                    <h3 className="mb-2 text-xl font-bold text-gray-900">Product not found on Google Shopping</h3>
                    <p className="mb-6 text-gray-600">
                        Fresh groceries like "{query}" handle best on Quick Commerce apps. <br />
                        Check availability in your area ({pincode || 'local'}) here:
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href={`https://blinkit.com/s/?q=${encodeURIComponent(query)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-500"
                        >
                            Blinkit
                        </a>
                        <a
                            href={`https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="rounded-lg bg-purple-600 px-6 py-3 font-bold text-white hover:bg-purple-700"
                        >
                            Zepto
                        </a>
                        <a
                            href={`https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="rounded-lg bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700"
                        >
                            Swiggy Instamart
                        </a>
                    </div>
                </div>
            ) : (
                /* Standard Results */
                <div className="grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {results.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isCheapest={product.price === minPrice && results.length > 1}
                        />
                    ))}
                </div>
            )}

            {hasSearched && results.length === 0 && !isGroceryFallback && !loading && (
                <div className="mt-12 flex flex-col items-center text-gray-500">
                    <Search className="mb-2 h-10 w-10 text-gray-300" />
                    <p>No results found for "{query}".</p>
                </div>
            )}
        </main>
    )
}
