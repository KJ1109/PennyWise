import {
    Coffee,
    Car,
    ShoppingBag,
    Film,
    Receipt,
    Home,
    HelpCircle,
    Package,
    Tag,
    Bookmark,
    LucideIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export interface Category {
    id: string
    user_id: string
    name: string
    icon: string
    is_archived: boolean
    created_at: string
}

export const DEFAULT_CATEGORIES = [
    { name: 'Food', icon: Coffee },
    { name: 'Transport', icon: Car },
    { name: 'Shopping', icon: ShoppingBag },
    { name: 'Entertainment', icon: Film },
    { name: 'Bills', icon: Receipt },
    { name: 'Rent', icon: Home },
    { name: 'Other', icon: HelpCircle }
]

export const GENERIC_ICONS: Record<string, LucideIcon> = {
    'Tag': Tag,
    'Bookmark': Bookmark,
    'Package': Package
}

// Helper to get icon component
export const getCategoryIcon = (categoryName: string, customIconName?: string): LucideIcon => {
    // 1. Check Default Categories
    const defaultCat = DEFAULT_CATEGORIES.find(c => c.name === categoryName)
    if (defaultCat) return defaultCat.icon

    // 2. Check Generic Icon Name (from DB)
    if (customIconName && GENERIC_ICONS[customIconName]) {
        return GENERIC_ICONS[customIconName]
    }

    // 3. Fallback
    return Tag
}

// Hook to fetch categories
export function useCategories(userId?: string) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCategories = async () => {
        if (!userId) return

        const supabase = createClient()
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('name')

        if (!error && data) {
            setCategories(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCategories()
    }, [userId])

    return {
        categories,
        loading,
        refreshCategories: fetchCategories,
        // Combined list for UI (Defaults + Active Custom)
        uiCategories: [
            ...DEFAULT_CATEGORIES.map(c => ({
                id: 'default-' + c.name,
                name: c.name,
                icon: 'Default',
                is_archived: false,
                is_default: true
            })),
            ...categories.filter(c => !c.is_archived).map(c => ({
                ...c,
                is_default: false
            }))
        ]
    }
}
