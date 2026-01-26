'use client'

import { useState } from 'react'
import { addGoal, deleteGoal, updateGoalAmount, updateGoal } from '@/app/actions/dashboard-features'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2, Mountain, Car, Home, Gamepad2, Plane, Gift, ShoppingBag, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/budget'

const GOAL_ICONS: Record<string, any> = {
    vacation: Plane,
    vehicle: Car,
    home: Home,
    gadget: Gamepad2,
    gift: Gift,
    shopping: ShoppingBag,
    other: Mountain
}

export function SavingsGoals({ initialGoals }: { initialGoals: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [topUpGoal, setTopUpGoal] = useState<any>(null)
    const [editingGoal, setEditingGoal] = useState<any>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await addGoal(formData)
        setLoading(false)
        if (res?.error) {
            alert("Error adding goal")
        } else {
            setIsOpen(false)
        }
    }

    async function handleEditSubmit(formData: FormData) {
        setLoading(true)
        const res = await updateGoal(formData)
        setLoading(false)
        if (res?.error) {
            alert("Error updating goal")
        } else {
            setEditingGoal(null)
        }
    }

    async function handleTopUpSubmit(formData: FormData) {
        if (!topUpGoal) return
        setLoading(true)
        const addedAmount = Number(formData.get('amount'))
        const newTotal = Number(topUpGoal.current_amount) + addedAmount

        await updateGoalAmount(topUpGoal.id, newTotal)
        setLoading(false)
        setTopUpGoal(null)
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this savings goal?")) return
        await deleteGoal(id)
    }

    return (
        <div className="h-full flex flex-col p-6 pt-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="font-bold text-foreground">Savings Goals</h3>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs text-primary font-bold flex items-center gap-1 hover:bg-primary/10 blue:text-blue-300 blue:hover:bg-blue-400/10">
                            <Plus className="h-3 w-3" /> New
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Savings Goal</DialogTitle>
                        </DialogHeader>
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Goal Name</label>
                                <input name="title" required className="w-full rounded-md border bg-background p-2" placeholder="e.g. Dream Vacation" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Target Amount</label>
                                    <input name="target_amount" type="number" step="0.01" required className="w-full rounded-md border bg-background p-2" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Current Saved</label>
                                    <input name="current_amount" type="number" step="0.01" defaultValue="0" className="w-full rounded-md border bg-background p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Target Date (Optional)</label>
                                <input name="target_date" type="date" className="w-full rounded-md border bg-background p-2" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Icon</label>
                                <select name="icon_name" className="w-full rounded-md border bg-background p-2">
                                    <option value="other">General</option>
                                    <option value="vacation">Vacation</option>
                                    <option value="vehicle">Vehicle</option>
                                    <option value="home">Home</option>
                                    <option value="gadget">Gadget</option>
                                    <option value="shopping">Shopping</option>
                                </select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Goal'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4 scrollbar-hide">
                {initialGoals.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">No active savings goals.</p>
                )}

                {initialGoals.map((goal) => {
                    const Icon = GOAL_ICONS[goal.icon_name || 'other'] || Mountain
                    const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100)
                    const remaining = goal.target_amount - goal.current_amount

                    return (
                        <div key={goal.id} className="group relative">
                            {/* Actions Group (Hover) */}
                            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => setEditingGoal(goal)}
                                    className="p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 blue:text-blue-300 blue:bg-blue-400/10 blue:hover:bg-blue-400/20"
                                    title="Edit Goal"
                                >
                                    <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={() => handleDelete(goal.id)}
                                    className="p-1.5 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20"
                                    title="Delete Goal"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>

                            <div className="p-5 rounded-2xl bg-card border border-border relative overflow-hidden transition-all hover:border-primary/50">
                                <div className="flex justify-between items-start mb-4 pr-16 md:pr-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary blue:text-blue-300 blue:bg-blue-400/10">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">{goal.title}</h4>
                                            {goal.target_date && (
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{goal.target_date}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Currently Saved</p>
                                            <p className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(goal.current_amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs px-2 mb-1"
                                                onClick={() => setTopUpGoal(goal)}
                                            >
                                                Top Up
                                            </Button>
                                            <p className="text-xs text-muted-foreground">Target: {formatCurrency(goal.target_amount)}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                                        <span className="text-primary blue:text-blue-300">{progress.toFixed(1)}% Completed</span>
                                        <span className="text-muted-foreground">{formatCurrency(Math.max(0, remaining))} to go</span>
                                    </div>
                                </div>
                                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Top Up Dialog */}
            <Dialog open={!!topUpGoal} onOpenChange={(open) => !open && setTopUpGoal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Top Up: {topUpGoal?.title}</DialogTitle>
                    </DialogHeader>
                    <form action={handleTopUpSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Amount to Add</label>
                            <input name="amount" type="number" step="0.01" required autoFocus className="w-full rounded-md border bg-background p-2" placeholder="0.00" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setTopUpGoal(null)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Funds'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Goal Dialog */}
            <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Goal</DialogTitle>
                    </DialogHeader>
                    <form action={handleEditSubmit} className="space-y-4">
                        <input type="hidden" name="id" value={editingGoal?.id || ''} />
                        <div>
                            <label className="text-sm font-medium">Goal Name</label>
                            <input name="title" defaultValue={editingGoal?.title || ''} required className="w-full rounded-md border bg-background p-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Target Amount</label>
                                <input name="target_amount" type="number" step="0.01" defaultValue={editingGoal?.target_amount || ''} required className="w-full rounded-md border bg-background p-2" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Current Saved</label>
                                <input name="current_amount" type="number" step="0.01" defaultValue={editingGoal?.current_amount || ''} className="w-full rounded-md border bg-background p-2" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Target Date (Optional)</label>
                            <input name="target_date" type="date" defaultValue={editingGoal?.target_date || ''} className="w-full rounded-md border bg-background p-2" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Icon</label>
                            <select name="icon_name" defaultValue={editingGoal?.icon_name || 'other'} className="w-full rounded-md border bg-background p-2">
                                <option value="other">General</option>
                                <option value="vacation">Vacation</option>
                                <option value="vehicle">Vehicle</option>
                                <option value="home">Home</option>
                                <option value="gadget">Gadget</option>
                                <option value="shopping">Shopping</option>
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingGoal(null)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
