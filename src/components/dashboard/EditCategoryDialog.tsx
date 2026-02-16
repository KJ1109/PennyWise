'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Trash2, AlertTriangle } from 'lucide-react'

interface EditCategoryDialogProps {
    category: { id: string, name: string, is_archived?: boolean }
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
}

export function EditCategoryDialog({ category, isOpen, onClose, onUpdate }: EditCategoryDialogProps) {
    const [name, setName] = useState(category.name)
    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || name === category.name) return

        setLoading(true)
        const supabase = createClient()

        // 1. Update Category Name
        const { error: catError } = await supabase
            .from('categories')
            .update({ name: name.trim() })
            .eq('id', category.id)

        if (catError) {
            alert('Failed to update category name: ' + catError.message)
            setLoading(false)
            return
        }

        // 2. Batch Update Expenses (Old Name -> New Name)
        // Note: This relies on exact string match.
        const { error: expError } = await supabase
            .from('expenses')
            .update({ category: name.trim() })
            .eq('category', category.name)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id!)

        if (expError) {
            alert('Category renamed, but failed to update existing expenses. Please update them manually.')
        }

        onUpdate()
        onClose()
        setLoading(false)
    }

    const handleArchive = async () => {
        setLoading(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('categories')
            .update({ is_archived: true })
            .eq('id', category.id)

        if (error) {
            alert('Failed to archive category')
        } else {
            onUpdate()
            onClose()
        }
        setLoading(false)
    }

    const handlePermanentDelete = async () => {
        setLoading(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', category.id)

        if (error) {
            alert('Failed to delete category')
        } else {
            onUpdate()
            onClose()
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>

                {showDeleteConfirm ? (
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
                            <AlertTriangle size={24} />
                            <div>
                                <h4 className="font-bold">Irreversible Action</h4>
                                <p className="text-sm">Deleting this category is permanent. Historical expenses will remain but the category definition will be lost.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handlePermanentDelete} disabled={loading}>
                                {loading ? 'Deleting...' : 'Confirm Delete'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <form onSubmit={handleRename} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <div className="flex gap-2">
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <Button type="submit" disabled={loading || name === category.name}>
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </form>

                        <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-2 text-gray-500">Danger Zone</h4>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                    onClick={handleArchive}
                                    disabled={loading}
                                >
                                    Archive (Soft Delete)
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={loading}
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Permanently Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
