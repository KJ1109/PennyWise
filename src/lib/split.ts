
export function calculateBalances(
    members: any[],
    expenses: any[]
) {
    // Map of userId -> amount owed (positive) or owed to others (negative)
    const balances: Record<string, number> = {}

    // Initialize with .id (standardized member object) or .user_id (raw db row) coverage
    members.forEach(m => {
        const id = m.id || m.user_id
        if (id) balances[id] = 0
    })

    expenses.forEach(e => {
        // Payer paid the full amount (+ Credit)
        const payerId = e.payer_id || e.manual_payer_id
        if (payerId) {
            balances[payerId] = (balances[payerId] || 0) + Number(e.amount)
        }

        // Splits - reduce net balance (- Debit)
        e.expense_splits?.forEach((s: any) => {
            const memberId = s.user_id || s.manual_member_id
            if (memberId) {
                balances[memberId] = (balances[memberId] || 0) - Number(s.amount_owed)
            }
        })
    })

    return balances
}

// Simplified debt simplification
export function simplifyDebts(netBalances: Record<string, number>) {
    // Returns a list of { from, to, amount }
    // This is a classic algorithm, simplified here.
    const debtors = []
    const creditors = []

    for (const [uid, amount] of Object.entries(netBalances)) {
        if (amount < -0.01) debtors.push({ uid, amount })
        if (amount > 0.01) creditors.push({ uid, amount })
    }

    debtors.sort((a, b) => a.amount - b.amount)
    creditors.sort((a, b) => b.amount - a.amount)

    const settlements = []

    let i = 0 // debtor index
    let j = 0 // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i]
        const creditor = creditors[j]

        const amount = Math.min(Math.abs(debtor.amount), creditor.amount)

        settlements.push({
            from: debtor.uid,
            to: creditor.uid,
            amount
        })

        debtor.amount += amount
        creditor.amount -= amount

        if (Math.abs(debtor.amount) < 0.01) i++
        if (creditor.amount < 0.01) j++
    }

    return settlements
}


export function calculatePairwiseDebts(expenses: any[], members: any[]) {
    // 1. aggregatedDebts[from][to] = amount
    const debts: Record<string, Record<string, number>> = {}

    // Initialize
    members.forEach(m1 => {
        debts[m1.id] = {}
        members.forEach(m2 => {
            if (m1.id !== m2.id) debts[m1.id][m2.id] = 0
        })
    })

    expenses.forEach(e => {
        const payerId = e.payer_id || e.manual_payer_id
        if (!payerId) return

        e.expense_splits.forEach((s: any) => {
            const borrowerId = s.user_id || s.manual_member_id
            if (!borrowerId || borrowerId === payerId) return

            // Borrower owes Payer
            const amount = Number(s.amount_owed)
            if (!debts[borrowerId]) debts[borrowerId] = {}
            if (!debts[borrowerId][payerId]) debts[borrowerId][payerId] = 0

            debts[borrowerId][payerId] += amount
        })
    })

    // 2. Net them out (A->B 100, B->A 20  => A->B 80)
    const settlements: { from: string, to: string, amount: number }[] = []

    // We only need to iterate triangles, but simpler: iterate all pairs, normalize.
    const processed = new Set<string>()

    members.forEach(m1 => {
        members.forEach(m2 => {
            if (m1.id === m2.id) return

            const key = [m1.id, m2.id].sort().join('-')
            if (processed.has(key)) return
            processed.add(key)

            const m1OwesM2 = debts[m1.id]?.[m2.id] || 0
            const m2OwesM1 = debts[m2.id]?.[m1.id] || 0

            if (m1OwesM2 > m2OwesM1) {
                const net = m1OwesM2 - m2OwesM1
                if (net > 0.01) settlements.push({ from: m1.id, to: m2.id, amount: net })
            } else {
                const net = m2OwesM1 - m1OwesM2
                if (net > 0.01) settlements.push({ from: m2.id, to: m1.id, amount: net })
            }
        })
    })

    return settlements
}
