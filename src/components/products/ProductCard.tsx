'use client'

import { Product } from '@/lib/search'
import { formatCurrency } from '@/lib/budget'
import { ExternalLink, Star } from 'lucide-react'

export function ProductCard({ product, isCheapest }: { product: Product, isCheapest: boolean }) {
    // Parsing price safely
    const sortPrice = product.price

    return (
        <div className={`relative flex flex-col rounded-xl border border-border bg-card text-card-foreground p-4 shadow-xl backdrop-blur-sm transition-all hover:bg-accent/10 ${isCheapest ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(0,255,65,0.2)]' : ''}`}>
            {isCheapest && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-[0_0_15px_rgba(0,255,65,0.6)] z-10 whitespace-nowrap">
                    Best Value
                </div>
            )}

            <div className="mb-4 aspect-square w-full overflow-hidden rounded-lg bg-white p-2">
                <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-contain"
                    loading="lazy"
                />
            </div>

            <div className="mb-2 flex items-start justify-between">
                <span className="inline-block rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {product.source}
                </span>
                {product.rating > 0 && (
                    <div className="flex items-center text-xs text-[#00C896]">
                        <Star className="mr-1 h-3 w-3 fill-[#00C896]" />
                        {product.rating}
                    </div>
                )}
            </div>

            <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground" title={product.title}>
                {product.title}
            </h3>

            {product.delivery && (
                <p className="mb-2 text-xs text-muted-foreground">
                    {product.delivery}
                </p>
            )}

            <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
                <span className="text-lg font-bold text-primary drop-shadow-[0_0_10px_rgba(0,255,65,0.4)]">
                    {formatCurrency(sortPrice)}
                </span>

                <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </div>
    )
}
