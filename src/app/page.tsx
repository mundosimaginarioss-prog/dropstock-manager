'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Package, Users, BarChart3, Plus, Edit, Trash2, Eye, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Client, StockItem, User, ViewType } from '@/lib/types'
import { 
  calculateDashboardStats, 
  searchStockItems, 
  formatPhone, 
  formatNumber,
  validateEmail,
  validatePhone,
  validateSKU
} from '@/lib/utils'

// Dados mockados para demonstração
const mockClients: Client[] = [
  { id: 1, name: 'Empresa Alpha', email: 'contato@alpha.com', phone: '(11) 9999-1111', totalSKUs: 15 },
  { id: 2, name: 'Beta Solutions', email: 'admin@beta.com', phone: '(11) 9999-2222', totalSKUs: 8 },
  { id: 3, name: 'Gamma Corp', email: 'info@gamma.com', phone: '(11) 9999-3333', totalSKUs: 23 },
  { id: 4, name: 'Delta Industries', email: 'contact@delta.com', phone: '(11) 9999-4444', totalSKUs: 12 },
  { id: 5, name: 'Epsilon Tech', email: 'hello@epsilon.com', phone: '(11) 9999-5555', totalSKUs: 18 },
  { id: 6, name: 'Zeta Manufacturing', email: 'info@zeta.com', phone: '(11) 9999-6666', totalSKUs: 31 },
]

const mockStockItems: StockItem[] = [
  { id: 1, clientId: 1, clientName: 'Empresa Alpha', sku: 'SKU001', itemName: 'Parafuso M6x20', quantity: 150, quality: 'boa' },
  { id: 2, clientId: 1, clientName: 'Empresa Alpha', sku: 'SKU002', itemName: 'Porca Sextavada M6', quantity: 200, quality: 'boa' },
  { id: 3, clientId: 2, clientName: 'Beta Solutions', sku: 'SKU003', itemName: 'Arruela Lisa 6mm', quantity: 300, quality: 'boa' },
  { id: 4, clientId: 1, clientName: 'Empresa Alpha', sku: 'SKU004', itemName: 'Parafuso M8x30', quantity: 75, quality: 'avariada' },
  { id: 5, clientId: 3, clientName: 'Gamma Corp', sku: 'SKU005', itemName: 'Bucha Plástica 8mm', quantity: 500, quality: 'boa' },
  { id: 6, clientId: 2, clientName: 'Beta Solutions', sku: 'SKU001', itemName: 'Parafuso M6x20', quantity: 80, quality: 'boa' },
  { id: 7, clientId: 4, clientName: 'Delta Industries', sku: 'SKU006', itemName: 'Rebite Alumínio 4mm', quantity: 250, quality: 'boa' },
  { id: 8, clientId: 3, clientName: 'Gamma Corp', sku: 'SKU007', itemName: 'Parafuso Phillips M5x15', quantity: 120, quality: 'avariada' },
  { id: 9, clientId: 5, clientName: 'Epsilon Tech', sku: 'SKU008', itemName: 'Porca Borboleta M8', quantity: 90, quality: 'boa' },
  { id: 10, clientId: 6, clientName: 'Zeta Manufacturing', sku: 'SKU009', itemName: 'Arruela Pressão 10mm', quantity: 180, quality: 'boa' },
  { id: 11, clientId: 1, clientName: 'Empresa Alpha', sku: 'SKU010', itemName: 'Parafuso Cabeça Chata M4x12', quantity: 5, quality: 'boa' }, // Baixo estoque
  { id: 12, clientId: 4, clientName: 'Delta Industries', sku: 'SKU011', itemName: 'Bucha Nylon 6mm', quantity: 8, quality: 'avariada' }, // Baixo estoque
]

export default function DropEstoque() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StockItem[]>([])
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [stockItems, setStockItems] = useState<StockItem[]>(mockStockItems)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estados para modais
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingStock, setEditingStock] = useState<StockItem | null>(null)

  // Estados para edição de estatísticas
  const [editingStats, setEditingStats] = useState<{[key: string]: boolean}>({})
  const [tempStats, setTempStats] = useState<{[key: string]: string}>({})

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // NOVA IMPLEMENTAÇÃO: Busca global por SKU sem debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    if (value.trim()) {
      const results = searchStockItems(stockItems, value)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  // Função de login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginEmail && loginPassword) {
      setCurrentUser({ email: loginEmail, name: 'Administrador' })
      setIsAuthenticated(true)
    }
  }

  // Função de logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setCurrentView('dashboard')
    setSelectedClient(null)
  }

  // NOVA IMPLEMENTAÇÃO: Função para excluir cliente via API
  const handleDeleteClient = async (client: Client) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}?\n\nTodos os SKUs associados também serão removidos.`)) {
      try {
        const response = await fetch(`/api/clientes/${client.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          const result = await response.json()
          
          // Atualizar estado local
          setClients(prevClients => prevClients.filter(c => c.id !== client.id))
          setStockItems(prevItems => prevItems.filter(item => item.clientId !== client.id))
          
          // Se o cliente excluído estava selecionado, volta para a lista
          if (selectedClient?.id === client.id) {
            setCurrentView('clients')
            setSelectedClient(null)
          }

          alert(`Cliente excluído com sucesso! ${result.removedSKUs} SKUs foram removidos.`)
        } else {
          const error = await response.json()
          alert(`Erro ao excluir cliente: ${error.error}`)
        }
      } catch (error) {
        console.error('Erro ao excluir cliente:', error)
        alert('Erro de conexão ao excluir cliente')
      }
    }
  }

  // NOVA IMPLEMENTAÇÃO: Função para excluir SKU via API
  const handleDeleteSKU = async (stockItem: StockItem) => {
    if (window.confirm(`Tem certeza que deseja excluir o item ${stockItem.sku}?\n\n${stockItem.itemName}`)) {
      try {
        const response = await fetch(`/api/skus/${stockItem.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          const result = await response.json()
          
          // Atualizar estado local
          setStockItems(prevItems => prevItems.filter(item => item.id !== stockItem.id))
          
          // Atualizar contagem de SKUs do cliente
          setClients(prevClients => 
            prevClients.map(client => 
              client.id === stockItem.clientId 
                ? { ...client, totalSKUs: Math.max(0, client.totalSKUs - 1) }
                : client
            )
          )

          alert('SKU excluído com sucesso!')
        } else {
          const error = await response.json()
          alert(`Erro ao excluir SKU: ${error.error}`)
        }
      } catch (error) {
        console.error('Erro ao excluir SKU:', error)
        alert('Erro de conexão ao excluir SKU')
      }
    }
  }

  // CORREÇÃO: Função para editar estatísticas manualmente
  const handleEditStat = (statKey: string, currentValue: number) => {
    setEditingStats(prev => ({ ...prev, [statKey]: true }))
    setTempStats(prev => ({ ...prev, [statKey]: currentValue.toString() }))
  }

  const handleSaveStat = (statKey: string) => {
    const newValue = parseInt(tempStats[statKey])
    if (!isNaN(newValue) && newValue >= 0) {
      // Aqui você salvaria no banco de dados
      // Por enquanto, apenas atualizamos o estado local
      console.log(`Salvando ${statKey}: ${newValue}`)
    }
    setEditingStats(prev => ({ ...prev, [statKey]: false }))
    setTempStats(prev => ({ ...prev, [statKey]: '' }))
  }

  const handleCancelEditStat = (statKey: string) => {
    setEditingStats(prev => ({ ...prev, [statKey]: false }))
    setTempStats(prev => ({ ...prev, [statKey]: '' }))
  }

  // Calcular estatísticas
  const dashboardStats = calculateDashboardStats(clients, stockItems)

  // Tela de Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-black rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">DropEstoque</CardTitle>
            <p className="text-slate-600 mt-2">Sistema de Gestão de Estoque</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-black hover:from-amber-600 hover:to-gray-900 text-white font-medium transition-all duration-200 transform hover:scale-[1.02]"
              >
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sidebar Component
  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-black rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">DropEstoque</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <nav className="mt-8 px-4">
        <div className="space-y-2">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            className={`w-full justify-start h-12 ${currentView === 'dashboard' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => {setCurrentView('dashboard'); setSidebarOpen(false)}}
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Button>
          <Button
            variant={currentView === 'clients' ? 'default' : 'ghost'}
            className={`w-full justify-start h-12 ${currentView === 'clients' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => {setCurrentView('clients'); setSidebarOpen(false)}}
          >
            <Users className="w-5 h-5 mr-3" />
            Clientes
          </Button>
        </div>
      </nav>
    </div>
  )

  // NOVA IMPLEMENTAÇÃO: Componente de busca completamente refatorado
  const SearchBar = () => (
    <div className="relative w-96 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Buscar por SKU ou nome da peça..."
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full pl-10 h-10 border border-slate-200 rounded-md focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-slate-900 placeholder-slate-400"
        autoComplete="off"
        spellCheck="false"
      />
      
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {searchResults.map((item) => (
            <div 
              key={item.id} 
              className="p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 cursor-pointer"
              onClick={() => {
                const client = clients.find(c => c.id === item.clientId)
                if (client) {
                  setSelectedClient(client)
                  setCurrentView('client-stock')
                  setSearchQuery('')
                  setSearchResults([])
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-800">{item.sku}</p>
                  <p className="text-sm text-slate-600">{item.itemName}</p>
                  <p className="text-xs text-amber-600">{item.clientName}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge variant={item.quantity < 10 ? "destructive" : "secondary"} 
                         className={item.quantity < 10 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}>
                    {formatNumber(item.quantity)} pcs
                  </Badge>
                  <Badge variant={item.quality === 'boa' ? "secondary" : "destructive"}
                         className={item.quality === 'boa' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                    {item.quality === 'boa' ? 'Boa' : 'Avariada'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Topbar Component
  const Topbar = () => (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <SearchBar />
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-600">Olá, {currentUser?.name}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-600 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  // Dashboard View - SIMPLIFICADO conforme solicitado
  const DashboardView = () => {
    // Encontrar cliente com mais peças
    const clientWithMostPieces = clients.reduce((max, client) => {
      const clientPieces = stockItems
        .filter(item => item.clientId === client.id)
        .reduce((sum, item) => sum + item.quantity, 0)
      
      const maxPieces = stockItems
        .filter(item => item.clientId === max.id)
        .reduce((sum, item) => sum + item.quantity, 0)
      
      return clientPieces > maxPieces ? client : max
    }, clients[0])

    const clientMostPiecesCount = stockItems
      .filter(item => item.clientId === clientWithMostPieces?.id)
      .reduce((sum, item) => sum + item.quantity, 0)

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard</h1>
          <p className="text-slate-600">Visão geral do sistema de estoque</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 text-sm font-medium">Total de Clientes</p>
                  <p className="text-3xl font-bold text-amber-800">
                    {formatNumber(dashboardStats.totalClients)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total de Peças</p>
                  <p className="text-3xl font-bold text-purple-800">
                    {formatNumber(dashboardStats.totalPieces)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 text-sm font-medium">Cliente com Mais Peças</p>
                  <p className="text-lg font-bold text-emerald-800 mb-1">
                    {clientWithMostPieces?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-emerald-600">
                    {formatNumber(clientMostPiecesCount)} peças
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // CORREÇÃO: Clients View com botão de exclusão melhorado
  const ClientsView = () => (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Clientes</h1>
          <p className="text-slate-600">Gerencie seus clientes e seus estoques</p>
        </div>
        <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <ClientForm />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{client.name}</h3>
                  <p className="text-sm text-slate-600">{client.email || 'Sem email'}</p>
                  <p className="text-sm text-slate-600">{client.phone ? formatPhone(client.phone) : 'Sem telefone'}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                    {formatNumber(client.totalSKUs)} SKUs
                  </Badge>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedClient(client)
                        setCurrentView('client-stock')
                      }}
                      className="text-amber-600 hover:text-amber-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingClient(client)
                        setIsClientModalOpen(true)
                      }}
                      className="text-slate-600 hover:text-slate-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClient(client)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Client Stock View
  const ClientStockView = () => {
    if (!selectedClient) return null
    
    const clientStock = stockItems.filter(item => item.clientId === selectedClient.id)
    
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button
              variant="ghost"
              onClick={() => setCurrentView('clients')}
              className="text-amber-600 hover:text-amber-700 mb-2"
            >
              ← Voltar para Clientes
            </Button>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{selectedClient.name}</h1>
            <p className="text-slate-600">Estoque do cliente • {formatNumber(clientStock.length)} itens</p>
          </div>
          <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Peça
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingStock ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
              </DialogHeader>
              <StockForm />
            </DialogContent>
          </Dialog>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-700">SKU</th>
                    <th className="text-left p-4 font-medium text-slate-700">Nome da Peça</th>
                    <th className="text-left p-4 font-medium text-slate-700">Quantidade</th>
                    <th className="text-left p-4 font-medium text-slate-700">Qualidade</th>
                    <th className="text-left p-4 font-medium text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientStock.map((item, index) => (
                    <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                      <td className="p-4 font-medium text-slate-800">{item.sku}</td>
                      <td className="p-4 text-slate-600">{item.itemName}</td>
                      <td className="p-4">
                        <span className="font-medium text-slate-800">{formatNumber(item.quantity)} pcs</span>
                      </td>
                      <td className="p-4">
                        <Badge variant={item.quality === 'boa' ? "secondary" : "destructive"}
                               className={item.quality === 'boa' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                          {item.quality === 'boa' ? 'Boa' : 'Avariada'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingStock(item)
                              setIsStockModalOpen(true)
                            }}
                            className="text-slate-600 hover:text-slate-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteSKU(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clientStock.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhum item no estoque</p>
                  <p className="text-sm text-slate-400">Adicione o primeiro item clicando em "Nova Peça"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Client Form Component
  const ClientForm = () => {
    const [name, setName] = useState(editingClient?.name || '')
    const [email, setEmail] = useState(editingClient?.email || '')
    const [phone, setPhone] = useState(editingClient?.phone || '')
    const [errors, setErrors] = useState<{[key: string]: string}>({})

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      // Validação - APENAS NOME É OBRIGATÓRIO
      const newErrors: {[key: string]: string} = {}
      
      if (!name.trim()) newErrors.name = 'Nome é obrigatório'
      
      // Email e telefone são opcionais, mas se preenchidos devem ser válidos
      if (email.trim() && !validateEmail(email)) newErrors.email = 'Email inválido'
      if (phone.trim() && !validatePhone(phone)) newErrors.phone = 'Telefone inválido'
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      if (editingClient) {
        // Editar cliente existente
        setClients(clients.map(c => 
          c.id === editingClient.id 
            ? { 
                ...c, 
                name: name.trim(), 
                email: email.trim() || undefined, 
                phone: phone.trim() ? formatPhone(phone) : undefined 
              }
            : c
        ))
      } else {
        // Criar novo cliente
        const newClient: Client = {
          id: Math.max(...clients.map(c => c.id)) + 1,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() ? formatPhone(phone) : undefined,
          totalSKUs: 0
        }
        setClients([...clients, newClient])
      }

      // Reset form
      setIsClientModalOpen(false)
      setEditingClient(null)
      setName('')
      setEmail('')
      setPhone('')
      setErrors({})
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Empresa *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da empresa"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@empresa.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsClientModalOpen(false)
              setEditingClient(null)
              setErrors({})
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            {editingClient ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    )
  }

  // Stock Form Component
  const StockForm = () => {
    const [sku, setSku] = useState(editingStock?.sku || '')
    const [itemName, setItemName] = useState(editingStock?.itemName || '')
    const [quantity, setQuantity] = useState(editingStock?.quantity.toString() || '')
    const [quality, setQuality] = useState<'boa' | 'avariada'>(editingStock?.quality || 'boa')
    const [errors, setErrors] = useState<{[key: string]: string}>({})

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!selectedClient) return

      // Validação
      const newErrors: {[key: string]: string} = {}
      
      if (!validateSKU(sku)) newErrors.sku = 'SKU deve ter pelo menos 3 caracteres e não conter espaços'
      if (!itemName.trim()) newErrors.itemName = 'Nome da peça é obrigatório'
      if (!quantity || parseInt(quantity) < 0) newErrors.quantity = 'Quantidade deve ser um número positivo'
      
      // Verificar SKU duplicado para o mesmo cliente
      if (!editingStock) {
        const existingSKU = stockItems.find(item => 
          item.clientId === selectedClient.id && 
          item.sku.toLowerCase() === sku.toLowerCase()
        )
        if (existingSKU) {
          newErrors.sku = 'SKU já existe para este cliente'
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      if (editingStock) {
        // Editar item existente
        setStockItems(stockItems.map(item => 
          item.id === editingStock.id 
            ? { 
                ...item, 
                sku: sku.toUpperCase().trim(), 
                itemName: itemName.trim(), 
                quantity: parseInt(quantity),
                quality: quality
              }
            : item
        ))
      } else {
        // Criar novo item
        const newItem: StockItem = {
          id: Math.max(...stockItems.map(item => item.id)) + 1,
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          sku: sku.toUpperCase().trim(),
          itemName: itemName.trim(),
          quantity: parseInt(quantity),
          quality: quality
        }
        setStockItems([...stockItems, newItem])
        
        // Atualizar contagem de SKUs do cliente
        setClients(clients.map(c => 
          c.id === selectedClient.id 
            ? { ...c, totalSKUs: c.totalSKUs + 1 }
            : c
        ))
      }

      // Reset form
      setIsStockModalOpen(false)
      setEditingStock(null)
      setSku('')
      setItemName('')
      setQuantity('')
      setQuality('boa')
      setErrors({})
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sku">Código SKU</Label>
          <Input
            id="sku"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            placeholder="SKU001"
            className={errors.sku ? 'border-red-500' : ''}
          />
          {errors.sku && <p className="text-sm text-red-600">{errors.sku}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="itemName">Nome da Peça</Label>
          <Input
            id="itemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Nome da peça"
            className={errors.itemName ? 'border-red-500' : ''}
          />
          {errors.itemName && <p className="text-sm text-red-600">{errors.itemName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100"
            className={errors.quantity ? 'border-red-500' : ''}
          />
          {errors.quantity && <p className="text-sm text-red-600">{errors.quantity}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quality">Qualidade</Label>
          <Select value={quality} onValueChange={(value: 'boa' | 'avariada') => setQuality(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a qualidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boa">Boa</SelectItem>
              <SelectItem value="avariada">Avariada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsStockModalOpen(false)
              setEditingStock(null)
              setErrors({})
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            {editingStock ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    )
  }

  // Main Layout
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="lg:ml-64">
        <Topbar />
        
        <main className="min-h-[calc(100vh-4rem)]">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'clients' && <ClientsView />}
          {currentView === 'client-stock' && <ClientStockView />}
        </main>
      </div>
    </div>
  )
}