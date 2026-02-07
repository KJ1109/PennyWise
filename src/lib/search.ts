export interface Product {
    id: string
    title: string
    price: number
    currency: string
    source: 'Amazon' | 'Flipkart' | 'Myntra'
    image: string
    url: string
    rating: number
    delivery?: string
}

export async function searchProducts(query: string): Promise<Product[]> {
    if (!query) return []

    const apiKey = process.env.SERPAPI_KEY
    if (!apiKey) {
        console.error("Missing SERPAPI_KEY")
        return []
    }

    try {
        const params = new URLSearchParams({
            engine: 'google_shopping',
            q: query,
            api_key: apiKey,
            google_domain: 'google.co.in',
            gl: 'in',
            hl: 'en',
            currency: 'INR',
        })

        // Direct Server-to-Server call to SerpApi
        const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
            // Revalidate every hour to save API credits, or set to 0 for real-time
            next: { revalidate: 3600 }
        })

        if (!res.ok) {
            console.error(`SerpApi failed: ${res.statusText}`)
            return []
        }

        const data = await res.json()

        if (data.error) {
            console.error("SerpApi Error:", data.error)
            return []
        }

        // Transform SerpApi Google Shopping results to our Product format
        if (data.shopping_results) {
            return data.shopping_results.map((item: any) => ({
                id: item.position?.toString() || Math.random().toString(),
                title: item.title,
                price: item.extracted_price || 0,
                currency: 'INR',
                source: item.source || 'Google Shopping',
                image: item.thumbnail,
                url: item.link,
                rating: item.rating || 0,
                delivery: item.delivery
            }))
        }
        return []
    } catch (error) {
        console.error("Search Logic Error:", error)
        return []
    }
}
