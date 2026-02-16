'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Archive, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import { Category, getCategoryIcon } from '@/lib/categories'

export function CategoryManager({
    userId,
    archivedCategories,
    onUpdate
}: {
    userId: string,
    archivedCategories: Category[],
    onUpdate: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

    const handleRestore = async (id: string) => {
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('categories')
            .update({ is_archived: false })
            .eq('id', id)

        if (error) {
            alert('Failed to restore category')
        } else {
            onUpdate()
        }
        setLoading(false)
    }

    const handlePermanentDelete = async () => {
        if (!categoryToDelete) return
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryToDelete.id)

        if (error) {
            alert('Failed to delete category')
        } else {
            setCategoryToDelete(null)
            onUpdate()
        }
        setLoading(false)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Archive size={14} />
                    Archived Categories
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Archived Categories</DialogTitle>
                </DialogHeader>

                {categoryToDelete ? (
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
                            <AlertTriangle size={24} />
                            <div>
                                <h4 className="font-bold">Irreversible Action</h4>
                                <p className="text-sm">Permanently delete "{categoryToDelete.name}"? Historical expenses will remain.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setCategoryToDelete(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handlePermanentDelete} disabled={loading}>
                                {loading ? 'Deleting...' : 'Confirm Delete'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        {archivedCategories.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No archived categories.</p>
                        ) : (
                            archivedCategories.map(cat => {
                                const Icon = getCategoryIcon(cat.name, cat.icon)
                                return (
                                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-700 rounded-full text-gray-500">
                                                <Icon size={16} />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleRestore(cat.id)}
                                                disabled={loading}
                                                title="Restore"
                                            >
                                                <RefreshCw size={14} />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setCategoryToDelete(cat)}
                                                disabled={loading}
                                                title="Delete Permanently"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
