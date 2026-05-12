'use client'

import { createClient } from '@/lib/supabase/client'
import type { 
  LoadType, PaymentStatus, Load, Expense, DailyRecord, 
  Truck, Employee, Message, Booking, DefaultExpenses, LoadPrices,
} from '@/lib/store'

const supabase = createClient()

// ── Trucks ──────────────────────────────────────────────────────────────────

export async function getTrucks(): Promise<Truck[]> {
  const { data, error } = await supabase
    .from('trucks')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error('getTrucks error:', error); return [] }
  return (data || []).map(t => ({
    id: t.id,
    plate: t.plate,
    driverName: t.driver_name,
    status: t.status as Truck['status'],
    assignedAt: t.assigned_at,
  }))
}

export async function addTruck(plate: string): Promise<Truck | null> {
  const { data, error } = await supabase
    .from('trucks')
    .insert({ plate, driver_name: null, status: 'inactive' })
    .select()
    .single()
  if (error) { console.error('addTruck error:', error); return null }
  return { id: data.id, plate: data.plate, driverName: data.driver_name, status: data.status }
}

export async function updateTruck(id: string, updates: Partial<{ plate: string; driverName: string | null; status: string; assignedAt: string }>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.plate !== undefined) dbUpdates.plate = updates.plate
  if (updates.driverName !== undefined) dbUpdates.driver_name = updates.driverName
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.assignedAt !== undefined) dbUpdates.assigned_at = updates.assignedAt

  const { error } = await supabase.from('trucks').update(dbUpdates).eq('id', id)
  if (error) console.error('updateTruck error:', error)
}

export async function deleteTruck(id: string): Promise<void> {
  const { error } = await supabase.from('trucks').delete().eq('id', id)
  if (error) console.error('deleteTruck error:', error)
}

// ── Employees ───────────────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error('getEmployees error:', error); return [] }
  return (data || []).map(e => ({
    id: e.id,
    name: e.name,
    role: e.role as Employee['role'],
    salary: Number(e.salary),
    defaultSalary: Number(e.default_salary),
    joinDate: e.join_date,
    status: e.status as Employee['status'],
    promotions: e.promotions || [],
  }))
}

export async function addEmployee(emp: Omit<Employee, 'id' | 'promotions'>): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .insert({
      name: emp.name,
      role: emp.role,
      salary: emp.salary,
      default_salary: emp.defaultSalary,
      join_date: emp.joinDate,
      status: emp.status,
      promotions: [],
    })
    .select()
    .single()
  if (error) { console.error('addEmployee error:', error); return null }
  return { 
    id: data.id, name: data.name, role: data.role, 
    salary: Number(data.salary), defaultSalary: Number(data.default_salary), 
    joinDate: data.join_date, status: data.status, promotions: data.promotions || [],
  }
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.salary !== undefined) dbUpdates.salary = updates.salary
  if (updates.defaultSalary !== undefined) dbUpdates.default_salary = updates.defaultSalary
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.promotions !== undefined) dbUpdates.promotions = updates.promotions

  const { error } = await supabase.from('employees').update(dbUpdates).eq('id', id)
  if (error) console.error('updateEmployee error:', error)
}

export async function removeEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) console.error('removeEmployee error:', error)
}

export async function promoteEmployee(
  id: string, toRole: Employee['role'], newSalary: number, note: string
): Promise<void> {
  const emps = await getEmployees()
  const emp = emps.find(e => e.id === id)
  if (!emp) return

  const promotion = { date: new Date().toISOString(), fromRole: emp.role, toRole, note }
  await updateEmployee(id, {
    role: toRole,
    salary: newSalary,
    promotions: [...emp.promotions, promotion],
  })
}

// ── Daily Records ───────────────────────────────────────────────────────────

export async function getRecords(): Promise<DailyRecord[]> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .order('date', { ascending: false })
  if (error) { console.error('getRecords error:', error); return [] }
  return (data || []).map(r => ({
    id: r.id,
    date: r.date,
    loads: r.loads as Load[],
    expenses: r.expenses as Expense,
    grossRevenue: Number(r.gross_revenue),
    totalExpenses: Number(r.total_expenses),
    netRevenue: Number(r.net_revenue),
    savedAt: r.saved_at,
    savedBy: r.saved_by,
  }))
}

export async function saveRecord(record: DailyRecord): Promise<void> {
  const dbRecord = {
    id: record.id,
    date: record.date,
    loads: record.loads,
    expenses: record.expenses,
    gross_revenue: record.grossRevenue,
    total_expenses: record.totalExpenses,
    net_revenue: record.netRevenue,
    saved_at: record.savedAt,
    saved_by: record.savedBy,
  }
  const { error } = await supabase
    .from('daily_records')
    .upsert(dbRecord, { onConflict: 'id' })
  if (error) console.error('saveRecord error:', error)
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from('daily_records').delete().eq('id', id)
  if (error) console.error('deleteRecord error:', error)
}

export async function getRecordsByDateRange(from: string, to: string): Promise<DailyRecord[]> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
  if (error) { console.error('getRecordsByDateRange error:', error); return [] }
  return (data || []).map(r => ({
    id: r.id, date: r.date, loads: r.loads as Load[], expenses: r.expenses as Expense,
    grossRevenue: Number(r.gross_revenue), totalExpenses: Number(r.total_expenses),
    netRevenue: Number(r.net_revenue), savedAt: r.saved_at, savedBy: r.saved_by,
  }))
}

// ── Messages ────────────────────────────────────────────────────────────────

export async function getMessages(username?: string): Promise<Message[]> {
  let query = supabase.from('messages').select('*').order('created_at', { ascending: true })
  if (username) {
    query = query.or(`from_user.eq.${username},to_user.eq.${username}`)
  }
  const { data, error } = await query
  if (error) { console.error('getMessages error:', error); return [] }
  return (data || []).map(m => ({
    id: m.id,
    fromUser: m.from_user,
    toUser: m.to_user,
    content: m.content,
    timestamp: m.created_at,
    read: m.read,
  }))
}

export async function sendMessage(msg: { fromUser: string; toUser: string; content: string }): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ from_user: msg.fromUser, to_user: msg.toUser, content: msg.content })
    .select()
    .single()
  if (error) { console.error('sendMessage error:', error); return null }
  return {
    id: data.id, fromUser: data.from_user, toUser: data.to_user,
    content: data.content, timestamp: data.created_at, read: data.read,
  }
}

export async function markMessagesRead(username: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('to_user', username)
    .eq('read', false)
  if (error) console.error('markMessagesRead error:', error)
}

// ── Bookings ────────────────────────────────────────────────────────────────

export async function getBookings(clientUsername?: string): Promise<Booking[]> {
  let query = supabase.from('bookings').select('*').order('created_at', { ascending: false })
  if (clientUsername) {
    query = query.eq('client_username', clientUsername)
  }
  const { data, error } = await query
  if (error) { console.error('getBookings error:', error); return [] }
  return (data || []).map(b => ({
    id: b.id,
    clientUsername: b.client_username,
    clientName: b.client_name,
    loadType: b.load_type as LoadType,
    loadTypeLabel: b.load_type_label,
    numberOfLoads: b.number_of_loads,
    preferred_date: b.preferred_date,
    delivery_address: b.delivery_address,
    status: b.status as Booking['status'],
    createdAt: b.created_at,
    notes: b.notes,
    estimated_delivery: b.estimated_delivery,
  }))
}

export async function saveBooking(booking: Booking): Promise<void> {
  const dbBooking = {
    id: booking.id,
    client_username: booking.clientUsername,
    client_name: booking.clientName,
    load_type: booking.loadType,
    load_type_label: booking.loadTypeLabel,
    number_of_loads: booking.numberOfLoads,
    preferred_date: booking.preferredDate,
    delivery_address: booking.deliveryAddress,
    status: booking.status,
    notes: booking.notes,
    estimated_delivery: booking.estimatedDelivery,
    created_at: booking.createdAt,
  }
  const { error } = await supabase
    .from('bookings')
    .upsert(dbBooking, { onConflict: 'id' })
  if (error) console.error('saveBooking error:', error)
}

export async function createBooking(
  booking: Omit<Booking, 'id' | 'createdAt'>,
  clientId: string
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      client_id: clientId,
      client_username: booking.clientUsername,
      client_name: booking.clientName,
      load_type: booking.loadType,
      load_type_label: booking.loadTypeLabel,
      number_of_loads: booking.numberOfLoads,
      preferred_date: booking.preferredDate,
      delivery_address: booking.deliveryAddress,
      status: booking.status,
      notes: booking.notes,
    })
    .select()
    .single()
  if (error) { console.error('createBooking error:', error); return null }
  return {
    id: data.id, clientUsername: data.client_username, clientName: data.client_name,
    loadType: data.load_type, loadTypeLabel: data.load_type_label,
    numberOfLoads: data.number_of_loads, preferredDate: data.preferred_date,
    deliveryAddress: data.delivery_address, status: data.status,
    createdAt: data.created_at, notes: data.notes, estimatedDelivery: data.estimated_delivery,
  }
}

export async function updateBookingStatus(
  id: string, status: Booking['status'], estimatedDelivery?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status }
  if (estimatedDelivery) updates.estimated_delivery = estimatedDelivery
  const { error } = await supabase.from('bookings').update(updates).eq('id', id)
  if (error) console.error('updateBookingStatus error:', error)
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function getDefaultExpenses(): Promise<DefaultExpenses> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'default_expenses')
    .single()
  return data?.value as DefaultExpenses ?? { workersFeePerLoad: 20, riversandFeePerLoad: 5 }
}

export async function saveDefaultExpenses(expenses: DefaultExpenses): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ value: expenses as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
    .eq('key', 'default_expenses')
  if (error) console.error('saveDefaultExpenses error:', error)
}

export async function getLoadPrices(): Promise<LoadPrices> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'load_prices')
    .single()
  return data?.value as LoadPrices ?? { riversand: 90, pitsand: 85, quarrystone: 85, gravel: 90, other: 0 }
}

export async function saveLoadPrices(prices: LoadPrices): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ value: prices as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
    .eq('key', 'load_prices')
  if (error) console.error('saveLoadPrices error:', error)
}

export async function getSettings(): Promise<{ defaultExpenses: DefaultExpenses; loadPrices: LoadPrices } | null> {
  const [e, p] = await Promise.all([getDefaultExpenses(), getLoadPrices()])
  return { defaultExpenses: e, loadPrices: p }
}

export async function saveSettings(settings: { defaultExpenses?: DefaultExpenses; loadPrices?: LoadPrices }): Promise<void> {
  const promises = []
  if (settings.defaultExpenses) promises.push(saveDefaultExpenses(settings.defaultExpenses))
  if (settings.loadPrices) promises.push(saveLoadPrices(settings.loadPrices))
  await Promise.all(promises)
}

// ── Profiles / Users ────────────────────────────────────────────────────────

export async function getProfiles(): Promise<{ id: string; username: string; role: string; email: string | null; status: string; suspended_until: string | null }[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) { console.error('getProfiles error:', error); return [] }
  return data || []
}

export async function updateProfileRole(id: string, role: string): Promise<{ success: boolean; error?: any }> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) {
    console.error('updateProfileRole error:', error)
    return { success: false, error }
  }
  return { success: true }
}

export async function updateProfileStatus(id: string, status: string, suspendedUntil: string | null = null): Promise<{ success: boolean; error?: any }> {
  const { error } = await supabase.from('profiles').update({ status, suspended_until: suspendedUntil }).eq('id', id)
  if (error) {
    console.error('updateProfileStatus error:', error)
    return { success: false, error }
  }
  return { success: true }
}

export async function suspendProfile(id: string, weeks: number): Promise<{ success: boolean; error?: any }> {
  const until = new Date()
  until.setDate(until.getDate() + (weeks * 7))
  return await updateProfileStatus(id, 'suspended', until.toISOString())
}
