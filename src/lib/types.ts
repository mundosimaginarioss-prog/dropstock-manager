// Tipos para o sistema DropEstoque

export interface Client {
  id: number
  name: string
  email?: string
  phone?: string
  totalSKUs: number
  createdAt?: Date
  updatedAt?: Date
}

export interface StockItem {
  id: number
  clientId: number
  clientName: string
  sku: string
  itemName: string
  quantity: number
  quality: 'boa' | 'avariada'
  minQuantity?: number
  maxQuantity?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface User {
  id?: number
  email: string
  name: string
  role?: 'admin' | 'user' | 'viewer'
  createdAt?: Date
}

export interface SearchResult extends StockItem {
  // Herda todas as propriedades de StockItem
}

export interface DashboardStats {
  totalClients: number
  totalSKUs: number
  totalPieces: number
  lowStockItems: number
}

export interface ClientFormData {
  name: string
  email?: string
  phone?: string
}

export interface StockFormData {
  sku: string
  itemName: string
  quantity: number
  quality: 'boa' | 'avariada'
  minQuantity?: number
  maxQuantity?: number
}

export type ViewType = 'dashboard' | 'clients' | 'client-stock' | 'reports'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Tipos para futuras expansões
export interface ActivityLog {
  id: number
  userId: number
  userName: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout'
  entity: 'client' | 'stock' | 'user'
  entityId: number
  details: string
  timestamp: Date
}

export interface Permission {
  id: number
  name: string
  description: string
}

export interface UserRole {
  id: number
  name: string
  permissions: Permission[]
}