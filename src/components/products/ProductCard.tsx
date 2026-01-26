'use client'

import { Product } from '@/lib/search'
import { formatCurrency } from '@/lib/budget'
import { ExternalLink, Star } from 'lucide-react'

export function ProductCard({ product, isCheapest }: { product: Product, isCheapest: boolean }) {
    // Parsing price safely
    const sortPrice = product.price

    return (
        <div className={`relative flex flex-col rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${isCheapest ? 'border-2 border-green-500' : ''}`}>
            {isCheapest && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Best Value
                </div>
            )}

            <div className="mb-4 aspect-square w-full overflow-hidden rounded-md bg-white p-2">
                <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-contain"
                />
            </div>

            <div className="mb-2 flex items-start justify-between">
                <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {product.source}
                </span>
                {product.rating && (
                    <div className="flex items-center text-xs text-gray-500">
                        <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {product.rating}
                    </div>
                )}
            </div>

            <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-900" title={product.title}>
                {product.title}
            </h3>

            {product.delivery && (
                <p className="mb-2 text-xs text-green-600">
                    {product.delivery}
                </p>
            )}

            <div className="mt-auto flex items-end justify-between">
                <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(sortPrice)}
                </span>

                <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </div>
    )
}
