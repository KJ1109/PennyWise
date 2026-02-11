import Link from 'next/link'
import { Users } from 'lucide-react'

interface Group {
    id: string
    name: string
    created_at: string
}

export function GroupList({ groups }: { groups: Group[] }) {
    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border bg-gray-50 p-12 text-center text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                <Users className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p>You haven't joined any groups yet.</p>
            </div>
        )
    }

    return (
        <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            style={{ contentVisibility: 'auto', contain: 'layout paint' } as React.CSSProperties}
        >
            {groups.map((group) => (
                <Link
                    key={group.id}
                    href={`/splitwise/group?id=${group.id}`}
                    className="flex flex-col rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900 dark:border-gray-800 blue:hover:bg-[#1e3a8a] blue:hover:bg-none group"
                >
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 blue:bg-blue-900/30 blue:text-blue-300 blue:group-hover:bg-[#D6E6F3] blue:group-hover:text-[#000926]">
                            <Users className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white blue:text-white blue:group-hover:text-[#D6E6F3]">{group.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 blue:text-gray-400 blue:group-hover:text-[#D6E6F3]">{group.name === 'Non-Group Expenses' ? 'Personal Expenses' : 'View expenses & balances'}</p>
                </Link>
            ))}
        </div>
    )
}
