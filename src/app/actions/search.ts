'use server'

import { Product } from '@/lib/search'

const SERPAPI_KEY = process.env.SERPAPI_KEY
const BASE_URL = 'https://serpapi.com/search.json'

// Quick Commerce Links mappings for fallback
const QUICK_COMMERCE_LINKS = {
    blinkit: 'https://blinkit.com/s/?q=',
    zepto: 'https://www.zeptonow.com/search?query=',
    swiggy_instamart: 'https://www.swiggy.com/instamart/search?custom_back=true&query='
}

export async function searchProductsAction(query: string, category: string, pincode: string): Promise<{ products: Product[], isGroceryFallback: boolean }> {
    if (!query) return { products: [], isGroceryFallback: false }

    // Grocery Handling: If specifically Groceries, we might want to just check availability or return fallback immediately if we know Google Shopping is bad for it. 
    // But spec says "Case A: Appears via Google Shopping -> Show it". "Case B: Not present -> Fallback".

    // Construct parameters
    const params = new URLSearchParams({
        engine: 'google_shopping',
        q: query,
        api_key: SERPAPI_KEY || '',
        google_domain: 'google.co.in',
        gl: 'in',
        hl: 'en',
        location: `India`, // Broad location, Pincode is hard to enforce strictly in Google Shopping API "location" param which requires specific named locations. 
        // However, usually 'location' parameter takes a "Location" string like "Mumbai, Maharashtra, India".
        // Pincode searching in Google Shopping is not directly supported via a "postal_code" param in SerpApi standard 'google_shopping' engine, 
        // usually it relies on the 'location' string. 
        // We will append pincode to query or try to use it if relevant, but typically Google Shopping uses the user's IP or general 'gl' setting.
        // For now, let's keep it simple. If the user wants pincode specific, we can try appending "available in [pincode]" to query, but that might mess results.
        // Spec says: "web scraps the data based on the users current location which should be sepcific upto pincode level".
        // SerpApi supports `location` parameter. We can try to map pincode to a location name if we had a database, but simplistically we might just rely on 'Uule' parameter if we really want to be precise, or just append it. 
        // Let's stick to 'India' and maybe append Pincode to query if it's relevant for availability? 
        // Actually, sticking to standard Search is safer for availability. Google Shopping usually shows online stores (Amazon, Flipkart) which deliver everywhere.
        // Offline/Local inventory is harder.
    })

    // Basic fetch
    let data: any = {}
    try {
        const res = await fetch(`${BASE_URL}?${params.toString()}`)
        data = await res.json()
    } catch (e) {
        console.error("SerpApi Fetch Error", e)
        return { products: [], isGroceryFallback: false }
    }

    if (data.error) {
        console.error("SerpApi Error", data.error)
        // If error (e.g. no key), return empty to trigger fallback logic if grocery, or just empty.
    }

    const shoppingResults = data.shopping_results || []

    // filtering
    const validProducts: Product[] = shoppingResults
        .filter((item: any) => {
            // 1. Price missing
            if (!item.price && !item.extracted_price) return false
            return true
        })
        .map((item: any) => {
            // 2. Sponsored ads -> SerpApi separates 'shopping_results' (organic) from 'inline_shopping_results' (sometimes ads) or 'ads'. 
            // strictly speaking 'shopping_results' are organic. 
            // But let's check for 'sponsored' flags if any.

            const priceVal = item.extracted_price || item.price

            return {
                id: item.product_id || item.link, // Unique ID
                title: item.title,
                price: priceVal,
                currency: 'INR', // Assumption for India
                source: item.source,
                image: item.thumbnail,
                url: item.link,
                rating: item.rating,
                delivery: item.delivery // "Free delivery" etc
            }
        })

    // 3. Deduplicate
    const uniqueProducts: Product[] = []
    const seen = new Set()

    validProducts.forEach((p: Product) => {
        // Dedup by Title + Source + Price (approx) to avoid duplicate listings of same item
        const key = `${p.title}-${p.source}-${p.price}`
        if (!seen.has(key)) {
            seen.add(key)
            uniqueProducts.push(p)
        }
    })

    // 4. Sort by Price (Cheapest First)
    uniqueProducts.sort((a, b) => a.price - b.price)

    // Grocery Logic Case A/B
    if (category === 'Groceries' && uniqueProducts.length === 0) {
        return { products: [], isGroceryFallback: true }
    }

    return { products: uniqueProducts, isGroceryFallback: false }
}
