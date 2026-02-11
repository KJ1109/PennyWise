'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2, Zap, Wifi, Home, CreditCard, Check, AlertCircle, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/budget'
import { useRouter } from 'next/navigation'

// Map categories to icons
const CATEGORY_ICONS: Record<string, any> = {
    electricity: Zap,
    internet: Wifi,
    rent: Home,
    subscription: CreditCard,
    other: AlertCircle,
    general: Tag
}

export function UpcomingPayments({ initialPayments }: { initialPayments: any[] }) {
    const [payments, setPayments] = useState(initialPayments)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isCustomCategory, setIsCustomCategory] = useState(false)
    const [editingPayment, setEditingPayment] = useState<any>(null)
    const router = useRouter()

    // Sync state if props change (re-fetch from parent)
    useEffect(() => {
        setPayments(initialPayments)
    }, [initialPayments])

    // Derived state for the form
    const isEditMode = !!editingPayment

    // Form Status
    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert('Please log in')
            setLoading(false)
            return
        }

        // Handle Custom Category Logic
        const selectValue = formData.get('category_select')
        let finalCategory = selectValue

        if (selectValue === 'other') {
            const desc = formData.get('category_custom') as string
            if (desc && desc.trim()) {
                finalCategory = desc.trim()
            }
        }

        const rawData = {
            title: formData.get('title'),
            amount: formData.get('amount'),
            due_date: formData.get('due_date'),
            category: finalCategory,
            user_id: user.id
        }

        let error = null
        let data = null

        if (isEditMode) {
            const { error: updateError, data: updatedData } = await supabase
                .from('upcoming_payments')
                .update(rawData)
                .eq('id', editingPayment.id)
                .select()
                .single()
            error = updateError
            if (updatedData) {
                setPayments(prev => prev.map(p => p.id === editingPayment.id ? updatedData : p))
            }
        } else {
            const { error: insertError, data: insertedData } = await supabase
                .from('upcoming_payments')
                .insert(rawData)
                .select()
                .single()
            error = insertError
            if (insertedData) {
                setPayments(prev => [...prev, insertedData])
            }
        }

        if (error) {
            console.error(error)
            alert("Error saving payment")
        } else {
            setIsOpen(false)
            setEditingPayment(null)
            setIsCustomCategory(false)
            router.refresh() // Refresh Server Data
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this payment reminder?")) return
        const supabase = createClient()
        const { error } = await supabase.from('upcoming_payments').delete().eq('id', id)

        if (error) {
            alert("Error deleting payment")
        } else {
            setPayments(prev => prev.filter(p => p.id !== id))
            router.refresh() // Refresh Server Data
        }
    }

    const openAddModal = () => {
        setEditingPayment(null)
        setIsCustomCategory(true) // Default to 'other' (custom)
        setIsOpen(true)
    }

    const openEditModal = (payment: any) => {
        setEditingPayment(payment)
        // Check if category is standard
        const lowerCat = payment.category?.toLowerCase() || 'other'
        const isStandard = ['electricity', 'internet', 'rent', 'subscription'].includes(lowerCat)

        // If not standard, it's effectively "other" (with a custom description potentially stored as category)
        setIsCustomCategory(!isStandard)
        setIsOpen(true)
    }

    // Sort: Earliest due date first
    const sortedPayments = [...payments].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    return (
        <div className="h-full flex flex-col p-6 pb-2">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="font-bold text-foreground">Upcoming Payments</h3>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) {
                        setEditingPayment(null)
                        setIsCustomCategory(false)
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={openAddModal}
                            className="h-8 w-8 p-0 rounded-full bg-primary/10 text-primary hover:bg-primary/20 blue:text-blue-300 blue:bg-blue-400/10 blue:hover:bg-blue-400/20"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? 'Edit Payment' : 'Add Upcoming Payment'}</DialogTitle>
                        </DialogHeader>
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <input
                                    name="title"
                                    defaultValue={editingPayment?.title}
                                    required
                                    className="w-full rounded-md border bg-background p-2"
                                    placeholder="e.g. Netflix"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Amount</label>
                                    <input
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingPayment?.amount}
                                        required
                                        className="w-full rounded-md border bg-background p-2"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Due Date</label>
                                    <input
                                        name="due_date"
                                        type="date"
                                        defaultValue={editingPayment?.due_date}
                                        required
                                        className="w-full rounded-md border bg-background p-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <div className="space-y-2">
                                    <select
                                        name="category_select"
                                        className="w-full rounded-md border bg-background p-2"
                                        onChange={(e) => setIsCustomCategory(e.target.value === 'other')}
                                        defaultValue={
                                            !editingPayment ? 'other' :
                                                ['electricity', 'internet', 'rent', 'subscription'].includes(editingPayment.category?.toLowerCase())
                                                    ? editingPayment.category?.toLowerCase()
                                                    : 'other'
                                        }
                                    >
                                        <option value="electricity">Electricity</option>
                                        <option value="internet">Internet</option>
                                        <option value="rent">Rent</option>
                                        <option value="subscription">Subscription</option>
                                        <option value="other">Other</option>
                                    </select>

                                    {isCustomCategory && (
                                        <input
                                            name="category_custom"
                                            className="w-full rounded-md border bg-background p-2 animate-in fade-in slide-in-from-top-1"
                                            placeholder="Description (Optional)"
                                            defaultValue={
                                                !editingPayment ? '' :
                                                    ['electricity', 'internet', 'rent', 'subscription'].includes(editingPayment.category?.toLowerCase())
                                                        ? '' // Was standard
                                                        : editingPayment.category !== 'other' ? editingPayment.category : '' // Was custom description
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Payment')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                {sortedPayments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming payments.</p>
                )}

                {sortedPayments.map((payment) => {
                    const lowerCat = payment.category?.toLowerCase()
                    const isStandard = ['electricity', 'internet', 'rent', 'subscription'].includes(lowerCat)
                    const DisplayIcon = isStandard ? CATEGORY_ICONS[lowerCat] : (lowerCat === 'other' ? CATEGORY_ICONS['other'] : Tag)

                    const daysDue = Math.ceil((new Date(payment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    const isDueSoon = daysDue <= 3 && daysDue >= 0

                    return (
                        <div key={payment.id} className="p-4 bg-card rounded-2xl border border-border group relative overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={() => openEditModal(payment)}>
                            <div className="flex justify-between items-start mb-2 pr-6">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", isDueSoon ? "bg-red-500" : "bg-primary")}>
                                    <DisplayIcon className="h-4 w-4" />
                                </div>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                    isDueSoon ? "text-red-500 bg-red-500/10" : "text-primary bg-primary/10 blue:text-blue-300 blue:bg-blue-400/10"
                                )}>
                                    {daysDue < 0 ? 'Overdue' : daysDue === 0 ? 'Today' : `Due in ${daysDue}d`}
                                </span>
                            </div>
                            <p className="font-semibold text-sm text-foreground truncate">{payment.title}</p>
                            <p className="text-xs text-muted-foreground mb-1 capitalize truncate">{payment.category}</p>
                            <p className="text-lg font-bold mt-1 text-foreground">{formatCurrency(payment.amount)}</p>

                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(payment.id); }}
                                    className="p-1.5 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20"
                                    title="Delete"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
