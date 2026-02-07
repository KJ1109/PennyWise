import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    const apiKey = process.env.SERPAPI_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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

        const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`)

        if (!res.ok) {
            throw new Error(`SerpApi failed: ${res.statusText}`)
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Search API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
