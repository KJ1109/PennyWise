import { SearchInput } from '@/components/products/SearchInput'
import { ProductResults } from '@/components/products/ProductResults'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string, pincode?: string }>
}) {
    // Await params in Next.js 15+ (if using that), but simpler to just await if it's a promise
    // In strict Next.js 15, searchParams is a Promise.
    const params = await searchParams
    const query = params?.q || ''
    const pincode = params?.pincode || ''

    return (
        <main className="flex-1 w-full min-h-screen flex flex-col items-center p-4 pt-8 pb-24 md:p-8">
            <div className="mb-6 text-center">
                <h1 className="mb-2 text-3xl font-bold text-foreground">Price Comparison</h1>
                <p className="text-muted-foreground">Find the best deals across the web.</p>
            </div>

            <SearchInput initialQuery={query} initialPincode={pincode} />

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="mt-4 text-gray-500">Searching across stores...</p>
                </div>
            }>
                <ProductResults query={query} pincode={pincode} />
            </Suspense>
        </main>
    )
}
