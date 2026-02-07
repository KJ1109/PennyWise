import { ProductCard } from '@/components/products/ProductCard'
import { searchProducts } from '@/lib/search'
import { Search, ShoppingBag, Zap } from 'lucide-react'

export async function ProductResults({ query, pincode }: { query: string, pincode?: string }) {
    if (!query) return null

    // Fetch on Server
    const products = await searchProducts(query)
    const sortedProducts = products.sort((a, b) => a.price - b.price)
    const minPrice = sortedProducts.length > 0 ? Math.min(...sortedProducts.map(p => p.price)) : 0

    const QuickCommerceLinks = () => (
        <div className="mb-8 flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:flex-row">
            <div className="flex items-center gap-2 text-sm font-medium text-current">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Quick Commerce ({pincode || 'Local'}):</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
                <a
                    href={`https://blinkit.com/s/?q=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-500 hover:bg-yellow-400 hover:text-black transition-all border border-yellow-400/20"
                >
                    Blinkit
                </a>
                <a
                    href={`https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-purple-600/10 px-4 py-2 text-xs font-bold text-purple-500 hover:bg-purple-600 hover:text-white transition-all border border-purple-600/20"
                >
                    Zepto
                </a>
                <a
                    href={`https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-orange-600/10 px-4 py-2 text-xs font-bold text-orange-500 hover:bg-orange-600 hover:text-white transition-all border border-orange-600/20"
                >
                    Swiggy
                </a>
            </div>
        </div>
    )

    if (sortedProducts.length === 0) {
        return (
            <div className="w-full max-w-6xl">
                <QuickCommerceLinks />
                <div className="mt-12 flex flex-col items-center text-muted-foreground">
                    <Search className="mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p>No results found for "{query}".</p>
                    <p className="mt-2 text-sm text-muted-foreground">Try checking the Quick Commerce apps above!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl">
            <QuickCommerceLinks />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        isCheapest={product.price === minPrice && sortedProducts.length > 1}
                    />
                ))}
            </div>
        </div>
    )
}
