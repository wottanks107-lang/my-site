// Финансы по месяцам. Приватный раздел.
import { createRepo } from './crud'
import type { FinanceMonth } from '../types'

const repo = createRepo<FinanceMonth>('finance_months', {
  order: [{ column: 'month' }],
  publicColumn: null,
})

export const listFinance = repo.list
export const getFinanceMonth = repo.get
export const createFinanceMonth = repo.create
export const updateFinanceMonth = repo.update
export const removeFinanceMonth = repo.remove

export type FinanceSummary = {
  income: number
  expense: number
  net: number
  sales: number
  goal: number
  goalProgress: number
}

export const MONTHLY_GOAL = 50_000

export async function financeSummary(): Promise<FinanceSummary> {
  const rows = await repo.list()
  const income = rows.reduce((sum, r) => sum + Number(r.income || 0), 0)
  const expense = rows.reduce((sum, r) => sum + Number(r.expense || 0), 0)
  const sales = rows.reduce((sum, r) => sum + Number(r.sales || 0), 0)
  const months = Math.max(rows.length, 1)
  const averageIncome = income / months
  return {
    income,
    expense,
    net: income - expense,
    sales,
    goal: MONTHLY_GOAL,
    goalProgress: Math.min(100, Math.round((averageIncome / MONTHLY_GOAL) * 100)),
  }
}
