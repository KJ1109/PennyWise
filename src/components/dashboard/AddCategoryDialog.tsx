'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddCategoryDialog({ userId, onCategoryAdded }: { userId: string, onCategoryAdded?: () => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('categories')
            .insert({
                user_id: userId,
                name: name.trim(),
                icon: 'Tag' // Generic default
            })

        if (error) {
            alert('Failed to add category. It might already exist.')
        } else {
            setName('')
            setIsOpen(false)
            onCategoryAdded?.()
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors h-full min-h-[120px] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <div className="p-2 rounded-full bg-white dark:bg-gray-800 border dark:border-gray-700">
                        <Plus size={20} />
                    </div>
                    <span className="text-sm font-medium">Add Category</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Custom Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Category Name</label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Subscriptions, Pets, Gym"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Creating...' : 'Create Category'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
