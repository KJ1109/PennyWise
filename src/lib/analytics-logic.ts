export interface Expense {
    date: string
    amount: number
    category: string
}

// --- CONSTANTS ---
const PREDEFINED_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Rent', 'Other']

// --- PREDICTION LOGIC ---

export function predictMonthlySpend(
    expenses: Expense[],
    monthlyBudget: number
) {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

    // Days elapsed (including today)
    const daysElapsed = Math.min(today.getDate(), totalDaysInMonth)

    // Filter expenses for this month so far
    const thisMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date)
        return d >= startOfMonth && d <= today
    })

    const spentSoFar = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Step 1: Average Daily Spend (Overall)
    const avgDaily = daysElapsed > 0 ? spentSoFar / daysElapsed : 0

    // Step 2: Recent Average (Last 7 days)
    const recentDaysCount = Math.min(7, daysElapsed)
    const recentThreshold = new Date(today)
    recentThreshold.setDate(today.getDate() - recentDaysCount)

    const recentExpenses = thisMonthExpenses.filter(e => new Date(e.date) > recentThreshold)
    const recentSpent = recentExpenses.reduce((sum, e) => sum + e.amount, 0)
    const recentAvg = recentDaysCount > 0 ? recentSpent / recentDaysCount : 0 // Fallback if 0 days

    // Step 3: Adaptive Weighting
    // w_recent = min(0.7, days_elapsed / total_days)
    const wRecent = Math.min(0.7, daysElapsed / totalDaysInMonth)
    const wOverall = 1 - wRecent

    // Step 4: Weighted Daily Spend
    const weightedDaily = (wRecent * recentAvg) + (wOverall * avgDaily)

    // Step 5: End-of-Month Prediction
    const predictedMonthlySpend = weightedDaily * totalDaysInMonth

    const budgetDelta = monthlyBudget - predictedMonthlySpend

    let status: 'Likely to exceed budget' | 'On track' | 'Potential savings'
    if (budgetDelta < 0) status = 'Likely to exceed budget' // Delta < 0 means Predicted > Budget
    else if (budgetDelta === 0) status = 'On track'
    else status = 'Potential savings'

    return {
        predictedMonthlySpend,
        budgetDelta,
        status,
        spentSoFar,
        daysElapsed
    }
}


// --- CONSISTENCY SCORE LOGIC ---

export function calculateConsistencyScore(
    expenses: Expense[],
    monthlyBudget: number
) {
    const today = new Date()
    // Last 30 days window
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 30) // last 30 days

    const relevantExpenses = expenses.filter(e => {
        const d = new Date(e.date)
        return d >= startDate && d <= today
    })

    // 1. Daily Spend Variance
    // Create array of 30 days with 0s
    const dailySpendsMap = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        dailySpendsMap.set(dateStr, 0)
    }

    relevantExpenses.forEach(e => {
        const dateStr = new Date(e.date).toISOString().split('T')[0]
        if (dailySpendsMap.has(dateStr)) {
            dailySpendsMap.set(dateStr, dailySpendsMap.get(dateStr)! + e.amount)
        }
    })

    const dailySpends = Array.from(dailySpendsMap.values())
    const N = dailySpends.length

    // Mean
    const sum = dailySpends.reduce((a, b) => a + b, 0)
    const mean = N > 0 ? sum / N : 0

    // Std Dev
    const varianceSum = dailySpends.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0)
    const stdDev = N > 0 ? Math.sqrt(varianceSum / N) : 0

    // Variance Ratio & Score
    const varianceRatio = mean > 0 ? stdDev / mean : 0
    // Score = max(0, 100 - (ratio * 100))
    // If mean is 0, score is 100 (perfectly stable at 0)
    const varianceScore = mean === 0 ? 100 : Math.max(0, 100 - (varianceRatio * 100))


    // 2. Budget Adherence Score
    const dailyBudget = monthlyBudget / 30 // Approx daily budget
    const overBudgetDays = dailySpends.filter(s => s > dailyBudget).length
    const adherenceRatio = 1 - (overBudgetDays / N)
    const budgetScore = adherenceRatio * 100


    // 3. Category Balance Score
    const totalSpend = relevantExpenses.reduce((s, e) => s + e.amount, 0)
    const categoryTotals: Record<string, number> = {}

    relevantExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
    })

    const maxCategorySpend = Math.max(...Object.values(categoryTotals), 0)
    const maxCategoryShare = totalSpend > 0 ? maxCategorySpend / totalSpend : 0 // If 0 spend, share is 0 -> perfect balance? Or 1? If 0 spend, max share is 0. 
    // Wait, if 0 spend, balance is perfect.

    const categoryScore = (1 - maxCategoryShare) * 100


    // Final Weighted Score
    // (0.5 × variance_score) + (0.3 × budget_score) + (0.2 × category_score)
    const finalScore = Math.min(100, Math.max(0,
        (0.5 * varianceScore) + (0.3 * budgetScore) + (0.2 * categoryScore)
    ))

    return {
        finalScore,
        components: {
            varianceScore,
            budgetScore,
            categoryScore
        },
        metadata: {
            mean,
            stdDev,
            overBudgetDays,
            maxCategoryShare
        }
    }
}


// --- BIGGEST DRAIN LOGIC ---
export function getBiggestMoneyDrain(expenses: Expense[], month: number, year: number) {
    const filtered = expenses.filter(e => {
        const d = new Date(e.date)
        return d.getFullYear() === year && d.getMonth() === month
    })

    if (filtered.length === 0) return null

    const categoryTotals: Record<string, number> = {}
    filtered.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
    })

    let maxCat = ''
    let maxAmount = -1

    Object.entries(categoryTotals).forEach(([cat, amount]) => {
        if (amount > maxAmount) {
            maxAmount = amount
            maxCat = cat
        }
    })

    return {
        category: maxCat,
        amount: maxAmount
    }
}
