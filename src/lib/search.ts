
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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (!query) return []

    // Generating realistic mock data based on query
    // In a real app, this would call a scraping API like BrightData or similar.

    const basePrice = Math.floor(Math.random() * 5000) + 500

    return [
        {
            id: '1',
            title: `${query} - Premium Edition`,
            price: basePrice,
            currency: 'INR',
            source: 'Amazon',
            image: 'https://placehold.co/200x200?text=Amazon+Item',
            url: '#',
            rating: 4.5
        },
        {
            id: '2',
            title: `${query} - Standard`,
            price: Math.floor(basePrice * 0.9), // 10% cheaper
            currency: 'INR',
            source: 'Flipkart',
            image: 'https://placehold.co/200x200?text=Flipkart+Item',
            url: '#',
            rating: 4.2
        },
        {
            id: '3',
            title: `${query} (Deep Discount)`,
            price: Math.floor(basePrice * 0.85), // 15% cheaper
            currency: 'INR',
            source: 'Amazon',
            image: 'https://placehold.co/200x200?text=Amazon+Deal',
            url: '#',
            rating: 4.0
        },
        {
            id: '4',
            title: `${query} - Fashion/Style`,
            price: Math.floor(basePrice * 1.1), // 10% more
            currency: 'INR',
            source: 'Myntra',
            image: 'https://placehold.co/200x200?text=Myntra+Style',
            url: '#',
            rating: 4.8
        }
    ]
}
