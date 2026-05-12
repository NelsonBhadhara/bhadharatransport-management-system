'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Bhadhara Transport – In-Memory Store (localStorage-backed for demo)
// ─────────────────────────────────────────────────────────────────────────────

export type LoadType = 'riversand' | 'pitsand' | 'quarrystone' | 'gravel' | 'other'
export type PaymentStatus = 'paid' | 'unpaid'
export type UserRole = 'admin' | 'client' | 'employee'

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
  date: string // ISO date string yyyy-MM-dd
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

// ─── Default seed data ────────────────────────────────────────────────────────

const DEFAULT_TRUCKS: Truck[] = [
  { id: 't1', plate: 'AFR4994', driverName: 'Gombe', status: 'active' },
  { id: 't2', plate: 'AFR2583', driverName: 'Tanya', status: 'active' },
  { id: 't3', plate: 'AFN8131', driverName: 'Tinashe', status: 'active' },
  { id: 't4', plate: 'UNASSIGNED', driverName: 'Fidza', status: 'active' },
  { id: 't5', plate: 'TRK-005', driverName: null, status: 'inactive' },
  { id: 't6', plate: 'TRK-006', driverName: null, status: 'inactive' },
  { id: 't7', plate: 'TRK-007', driverName: null, status: 'inactive' },
]

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Gombe', role: 'driver', salary: 300, defaultSalary: 300, joinDate: '2022-01-01', status: 'active', promotions: [] },
  { id: 'e2', name: 'Tanya', role: 'driver', salary: 300, defaultSalary: 300, joinDate: '2022-01-01', status: 'active', promotions: [] },
  { id: 'e3', name: 'Tinashe', role: 'driver', salary: 300, defaultSalary: 300, joinDate: '2022-01-01', status: 'active', promotions: [] },
  { id: 'e4', name: 'Fidza', role: 'driver', salary: 300, defaultSalary: 300, joinDate: '2022-01-01', status: 'active', promotions: [] },
]

const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'u1',
    username: 'Paytrans@2018!',
    passwordHash: 'Mukundi190426!',
    role: 'admin',
    email: 'admin@bhadharatransport.co.zw',
    createdAt: '2024-01-01',
    status: 'active',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Store class ──────────────────────────────────────────────────────────────

class BhadharaStore {
  // ── Auth ──────────────────────────────────────────────────────────────────
  getCurrentUser(): SystemUser | null {
    return loadFromStorage<SystemUser | null>('bht_current_user', null)
  }

  setCurrentUser(user: SystemUser | null): void {
    saveToStorage('bht_current_user', user)
  }

  login(username: string, password: string): SystemUser | null {
    const users = this.getUsers()
    const user = users.find(u => u.username === username && u.passwordHash === password && u.status === 'active')
    if (user) this.setCurrentUser(user)
    return user ?? null
  }

  logout(): void {
    this.setCurrentUser(null)
  }

  isAdmin(): boolean {
    const u = this.getCurrentUser()
    return u?.role === 'admin'
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers(): SystemUser[] {
    return loadFromStorage<SystemUser[]>('bht_users', DEFAULT_USERS)
  }

  saveUsers(users: SystemUser[]): void {
    saveToStorage('bht_users', users)
  }

  addUser(user: Omit<SystemUser, 'id' | 'createdAt'>): SystemUser | { error: string } {
    const users = this.getUsers()
    if (users.find(u => u.username === user.username)) {
      return { error: 'Username already exists. Please choose another.' }
    }
    const newUser: SystemUser = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    this.saveUsers([...users, newUser])
    return newUser
  }

  // ── Trucks ────────────────────────────────────────────────────────────────
  getTrucks(): Truck[] {
    return loadFromStorage<Truck[]>('bht_trucks', DEFAULT_TRUCKS)
  }

  saveTrucks(trucks: Truck[]): void {
    saveToStorage('bht_trucks', trucks)
  }

  updateTruck(id: string, updates: Partial<Truck>): void {
    const trucks = this.getTrucks().map(t => (t.id === id ? { ...t, ...updates } : t))
    this.saveTrucks(trucks)
  }

  addTruck(plate: string): Truck {
    const truck: Truck = {
      id: crypto.randomUUID(),
      plate,
      driverName: null,
      status: 'inactive',
    }
    this.saveTrucks([...this.getTrucks(), truck])
    return truck
  }

  // ── Employees ─────────────────────────────────────────────────────────────
  getEmployees(): Employee[] {
    return loadFromStorage<Employee[]>('bht_employees', DEFAULT_EMPLOYEES)
  }

  saveEmployees(employees: Employee[]): void {
    saveToStorage('bht_employees', employees)
  }

  addEmployee(emp: Omit<Employee, 'id' | 'promotions'>): Employee {
    const newEmp: Employee = { ...emp, id: crypto.randomUUID(), promotions: [] }
    this.saveEmployees([...this.getEmployees(), newEmp])
    return newEmp
  }

  updateEmployee(id: string, updates: Partial<Employee>): void {
    const emps = this.getEmployees().map(e => (e.id === id ? { ...e, ...updates } : e))
    this.saveEmployees(emps)
  }

  removeEmployee(id: string): void {
    this.saveEmployees(this.getEmployees().filter(e => e.id !== id))
  }

  promoteEmployee(id: string, toRole: Employee['role'], newSalary: number, note: string): void {
    const emps = this.getEmployees().map(e => {
      if (e.id !== id) return e
      const promotion = { date: new Date().toISOString(), fromRole: e.role, toRole, note }
      return { ...e, role: toRole, salary: newSalary, promotions: [...e.promotions, promotion] }
    })
    this.saveEmployees(emps)
  }

  // ── Daily Records ─────────────────────────────────────────────────────────
  getRecords(): DailyRecord[] {
    return loadFromStorage<DailyRecord[]>('bht_records', [])
  }

  saveRecords(records: DailyRecord[]): void {
    saveToStorage('bht_records', records)
  }

  saveRecord(record: DailyRecord): void {
    const existing = this.getRecords()
    const idx = existing.findIndex(r => r.id === record.id)
    if (idx >= 0) {
      existing[idx] = record
    } else {
      existing.push(record)
    }
    this.saveRecords(existing)
  }

  deleteRecord(id: string): void {
    this.saveRecords(this.getRecords().filter(r => r.id !== id))
  }

  getRecordsByDateRange(from: string, to: string): DailyRecord[] {
    return this.getRecords().filter(r => r.date >= from && r.date <= to)
  }

  // ── Messages ──────────────────────────────────────────────────────────────
  getMessages(): Message[] {
    return loadFromStorage<Message[]>('bht_messages', [])
  }

  saveMessage(msg: Omit<Message, 'id' | 'timestamp' | 'read'>): Message {
    const m: Message = { ...msg, id: crypto.randomUUID(), timestamp: new Date().toISOString(), read: false }
    const msgs = this.getMessages()
    msgs.push(m)
    saveToStorage('bht_messages', msgs)
    return m
  }

  markMessagesRead(username: string): void {
    const msgs = this.getMessages().map(m => (m.toUser === username ? { ...m, read: true } : m))
    saveToStorage('bht_messages', msgs)
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  getBookings(): Booking[] {
    return loadFromStorage<Booking[]>('bht_bookings', [])
  }

  saveBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    const b: Booking = { ...booking, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const bookings = this.getBookings()
    bookings.push(b)
    saveToStorage('bht_bookings', bookings)
    return b
  }

  updateBookingStatus(id: string, status: Booking['status'], estimatedDelivery?: string): void {
    const bookings = this.getBookings().map(b =>
      b.id === id ? { ...b, status, ...(estimatedDelivery ? { estimatedDelivery } : {}) } : b
    )
    saveToStorage('bht_bookings', bookings)
  }

  // ── Default Expenses ───────────────────────────────────────────────────────
  getDefaultExpenses(): DefaultExpenses {
    return loadFromStorage<DefaultExpenses>('bht_default_expenses', DEFAULT_EXPENSES)
  }

  saveDefaultExpenses(expenses: DefaultExpenses): void {
    DEFAULT_EXPENSES = expenses
    saveToStorage('bht_default_expenses', expenses)
  }

  updateDefaultExpense(key: keyof DefaultExpenses, value: number): void {
    const exp = this.getDefaultExpenses()
    exp[key] = value
    this.saveDefaultExpenses(exp)
  }

  // ── Load Prices ────────────────────────────────────────────────────────────
  getLoadPrices(): LoadPrices {
    return loadFromStorage<LoadPrices>('bht_load_prices', LOAD_PRICES)
  }

  saveLoadPrices(prices: LoadPrices): void {
    LOAD_PRICES = prices
    saveToStorage('bht_load_prices', prices)
  }

  updateLoadPrice(loadType: LoadType, price: number): void {
    const prices = this.getLoadPrices()
    prices[loadType] = price
    this.saveLoadPrices(prices)
  }
}

export const store = new BhadharaStore()

// ── Rate lookup ───────────────────────────────────────────────────────────────
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

export let DEFAULT_EXPENSES: DefaultExpenses = {
  workersFeePerLoad: 20,
  riversandFeePerLoad: 5,
}

export let LOAD_PRICES: LoadPrices = {
  riversand: 90,
  pitsand: 85,
  quarrystone: 85,
  gravel: 90,
  other: 0,
}

// For backward compatibility
export function getWorkersFeePer() {
  return DEFAULT_EXPENSES.workersFeePerLoad
}

export function getRiversandFeePer() {
  return DEFAULT_EXPENSES.riversandFeePerLoad
}

export const WORKERS_FEE_PER_LOAD = 20
export const RIVERSAND_FEE_PER_LOAD = 5

export function computeRecord(loads: Load[], expenses: Expense) {
  const grossRevenue = loads.reduce((sum, l) => sum + l.ratePerLoad * l.numberOfLoads, 0)
  const totalExpenses =
    expenses.workersFee + expenses.riversandFee + expenses.tyres + expenses.welding + expenses.other
  // Net revenue = gross revenue (all loads, paid + unpaid) - total expenses
  const netRevenue = grossRevenue - totalExpenses
  return { grossRevenue, totalExpenses, netRevenue }
}
