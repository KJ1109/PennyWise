export function calculateDailyBudget(monthlyBudget: number) {
    const today = new Date()
    // Get total days in current month (e.g., 28, 30, 31)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

    // Static Daily Budget = Monthly / TotalDays
    return Math.round(monthlyBudget / daysInMonth)
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}
