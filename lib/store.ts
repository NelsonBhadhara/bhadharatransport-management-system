'use client'

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Bhadhara Transport \u2013 Types & Computation Helpers
// Data is now stored in Supabase. See lib/supabase/database.ts for CRUD.
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export type LoadType = 'riversand' | 'pitsand' | 'quarrystone' | 'gravel' | 'other'
export type PaymentStatus = 'paid' | 'unpaid'
export type UserRole = 'admin' | 'client'

export interface Load {
  id: string
  loadType: LoadType
  loadTypeLabel: string
  ratePerLoad: number
  numberOfLoads: number
  customerName: string
  driverName: string
  truckPlate: string
  paymentStatus: PaymentStatus
  amountPaid: number
  notes?: string
}

export interface Expense {
  workersFee: number
  riversandFee: number
  tyres: number
  welding: number
  other: number
  otherLabel?: string
}

export interface DailyRecord {
  id: string
  date: string
  loads: Load[]
  expenses: Expense
  grossRevenue: number
  totalExpenses: number
  netRevenue: number
  savedAt: string
  savedBy: string
}

export interface Truck {
  id: string
  plate: string
  driverName: string | null
  status: 'active' | 'maintenance' | 'inactive'
  assignedAt?: string
}

export interface Employee {
  id: string
  name: string
  role: 'driver' | 'mechanic' | 'admin' | 'worker'
  salary: number
  defaultSalary: number
  joinDate: string
  status: 'active' | 'inactive'
  promotions: { date: string; fromRole: string; toRole: string; note: string }[]
}

export interface SystemUser {
  id: string
  username: string
  passwordHash: string
  role: UserRole
  email?: string
  createdAt: string
  status: 'active' | 'suspended'
}

export interface Message {
  id: string
  fromUser: string
  toUser: string
  content: string
  timestamp: string
  read: boolean
}

export interface Booking {
  id: string
  clientUsername: string
  clientName: string
  loadType: LoadType
  loadTypeLabel: string
  numberOfLoads: number
  preferredDate: string
  deliveryAddress: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  notes?: string
  estimatedDelivery?: string
}

export interface DefaultExpenses {
  workersFeePerLoad: number
  riversandFeePerLoad: number
}

export interface LoadPrices {
  riversand: number
  pitsand: number
  quarrystone: number
  gravel: number
  other: number
}

// \u2500\u2500 Static lookup tables \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export const LOAD_RATES: Record<LoadType, number> = {
  riversand: 90,
  pitsand: 85,
  quarrystone: 85,
  gravel: 90,
  other: 0,
}

export const LOAD_LABELS: Record<LoadType, string> = {
  riversand: 'River Sand',
  pitsand: 'Pit Sand',
  quarrystone: 'Quarry Stone',
  gravel: 'Gravel',
  other: 'Other',
}

// Backward-compat constants
export const WORKERS_FEE_PER_LOAD = 20
export const RIVERSAND_FEE_PER_LOAD = 5

export function getWorkersFeePer() { return WORKERS_FEE_PER_LOAD }
export function getRiversandFeePer() { return RIVERSAND_FEE_PER_LOAD }

// \u2500\u2500 Pure computation helper (no DB calls) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export function computeRecord(loads: Load[], expenses: Expense) {
  const grossRevenue = loads.reduce((sum, l) => sum + l.ratePerLoad * l.numberOfLoads, 0)
  const totalExpenses =
    expenses.workersFee + expenses.riversandFee + expenses.tyres + expenses.welding + expenses.other
  const netRevenue = grossRevenue - totalExpenses
  return { grossRevenue, totalExpenses, netRevenue }
}
