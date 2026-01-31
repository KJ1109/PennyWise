'use client'

import { useState } from 'react'
import { addPayment, deletePayment, togglePaymentStatus, updatePayment } from '@/app/actions/dashboard-features'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2, Zap, Wifi, Home, CreditCard, Check, AlertCircle, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/budget'

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
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isCustomCategory, setIsCustomCategory] = useState(false)
    const [editingPayment, setEditingPayment] = useState<any>(null)

    // Derived state for the form
    const isEditMode = !!editingPayment

    // Form Status
    async function handleSubmit(formData: FormData) {
        setLoading(true)

        // Handle Custom Category Logic
        const selectValue = formData.get('category_select')
        let finalCategory = selectValue

        // If "other" is selected, user might optionaly provide a description
        // User Requirement: "in other category he can add the description of what the other is and it should be optional"
        // I'll assume if they type "My Gym", we save "My Gym". If they leave it, we save "other".
        if (selectValue === 'other') {
            const desc = formData.get('category_custom') as string
            if (desc && desc.trim()) {
                finalCategory = desc.trim() // Save the custom description as the category name so it displays
            }
        }
        // Note: The previous logic had "custom_input" for type-your-own. The new requirement is "select other -> optional description".
        // I will merge them. Use 'other' as the trigger for the input.

        // Clean up formData
        formData.set('category', finalCategory as string)
        formData.delete('category_select')
        formData.delete('category_custom')

        if (isEditMode) {
            formData.append('id', editingPayment.id)
            const res = await updatePayment(formData)
            if (res?.error) alert("Error updating payment")
        } else {
            const res = await addPayment(formData)
            if (res?.error) alert("Error adding payment")
        }

        setLoading(false)
        setIsOpen(false)
        setEditingPayment(null)
        setIsCustomCategory(false)
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this payment reminder?")) return
        await deletePayment(id)
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
    const payments = [...initialPayments].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

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
                {payments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming payments.</p>
                )}

                {payments.map((payment) => {
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
