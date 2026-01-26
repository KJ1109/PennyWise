import { Home, Users, Search, Settings, PieChart } from 'lucide-react'

export const NAV_ITEMS = [
    {
        label: 'Home',
        href: '/',
        icon: Home,
    },
    {
        label: 'Splitwise',
        href: '/splitwise',
        icon: Users,
    },
    {
        label: 'Products',
        href: '/products',
        icon: Search,
    },
    {
        label: 'Analytics',
        href: '/analytics',
        icon: PieChart,
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
    },
]
