import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Client, StockItem, DashboardStats } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilitários para formatação
export function formatPhone(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '')
  
  // Aplica a máscara (11) 99999-9999
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  
  // Aplica a máscara (11) 9999-9999 para números com 10 dígitos
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  
  return phone
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Utilitários para validação
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

export function validateSKU(sku: string): boolean {
  // SKU deve ter pelo menos 3 caracteres e não conter espaços
  return sku.length >= 3 && !/\s/.test(sku)
}

// Utilitários para cálculos do dashboard
export function calculateDashboardStats(clients: Client[], stockItems: StockItem[]): DashboardStats {
  const totalClients = clients.length
  const uniqueSKUs = new Set(stockItems.map(item => item.sku))
  const totalSKUs = uniqueSKUs.size
  const totalPieces = stockItems.reduce((sum, item) => sum + item.quantity, 0)
  
  // Considera itens com quantidade baixa (menos de 10 peças)
  const lowStockItems = stockItems.filter(item => item.quantity < 10).length
  
  return {
    totalClients,
    totalSKUs,
    totalPieces,
    lowStockItems
  }
}

// Utilitários para busca
export function searchStockItems(items: StockItem[], query: string): StockItem[] {
  if (!query.trim()) return []
  
  const searchTerm = query.toLowerCase().trim()
  
  return items.filter(item => 
    item.sku.toLowerCase().includes(searchTerm) ||
    item.itemName.toLowerCase().includes(searchTerm) ||
    item.clientName.toLowerCase().includes(searchTerm)
  )
}

export function filterClientsByName(clients: Client[], query: string): Client[] {
  if (!query.trim()) return clients
  
  const searchTerm = query.toLowerCase().trim()
  
  return clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm)
  )
}

// Utilitários para ordenação
export function sortClientsByName(clients: Client[], ascending: boolean = true): Client[] {
  return [...clients].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, 'pt-BR')
    return ascending ? comparison : -comparison
  })
}

export function sortStockItemsBySKU(items: StockItem[], ascending: boolean = true): StockItem[] {
  return [...items].sort((a, b) => {
    const comparison = a.sku.localeCompare(b.sku)
    return ascending ? comparison : -comparison
  })
}

export function sortStockItemsByQuantity(items: StockItem[], ascending: boolean = true): StockItem[] {
  return [...items].sort((a, b) => {
    const comparison = a.quantity - b.quantity
    return ascending ? comparison : -comparison
  })
}

// Utilitários para geração de dados mock
export function generateMockSKU(): string {
  const prefix = 'SKU'
  const number = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `${prefix}${number}`
}

export function generateMockClient(): Omit<Client, 'id'> {
  const companies = [
    'Tech Solutions', 'Digital Corp', 'Innovation Labs', 'Future Systems',
    'Smart Industries', 'Advanced Tech', 'Modern Solutions', 'Elite Corp'
  ]
  
  const domains = ['tech.com', 'corp.com', 'solutions.com', 'systems.com']
  
  const companyName = companies[Math.floor(Math.random() * companies.length)]
  const domain = domains[Math.floor(Math.random() * domains.length)]
  
  return {
    name: companyName,
    email: `contato@${companyName.toLowerCase().replace(' ', '')}.${domain}`,
    phone: `(11) 9${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}-${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
    totalSKUs: Math.floor(Math.random() * 50) + 1
  }
}

// Utilitários para localStorage (para persistência local)
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error)
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error)
    return defaultValue
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Erro ao remover do localStorage:', error)
  }
}

// Utilitários para debounce (útil para busca em tempo real)
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}