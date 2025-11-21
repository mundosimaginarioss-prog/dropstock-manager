import { NextRequest, NextResponse } from 'next/server'

// Simulação de dados (em produção seria PostgreSQL)
let mockStockItems = [
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
  { id: 11, clientId: 1, clientName: 'Empresa Alpha', sku: 'SKU010', itemName: 'Parafuso Cabeça Chata M4x12', quantity: 5, quality: 'boa' },
  { id: 12, clientId: 4, clientName: 'Delta Industries', sku: 'SKU011', itemName: 'Bucha Nylon 6mm', quantity: 8, quality: 'avariada' },
]

let mockClients = [
  { id: 1, name: 'Empresa Alpha', email: 'contato@alpha.com', phone: '(11) 9999-1111', totalSKUs: 15 },
  { id: 2, name: 'Beta Solutions', email: 'admin@beta.com', phone: '(11) 9999-2222', totalSKUs: 8 },
  { id: 3, name: 'Gamma Corp', email: 'info@gamma.com', phone: '(11) 9999-3333', totalSKUs: 23 },
  { id: 4, name: 'Delta Industries', email: 'contact@delta.com', phone: '(11) 9999-4444', totalSKUs: 12 },
  { id: 5, name: 'Epsilon Tech', email: 'hello@epsilon.com', phone: '(11) 9999-5555', totalSKUs: 18 },
  { id: 6, name: 'Zeta Manufacturing', email: 'info@zeta.com', phone: '(11) 9999-6666', totalSKUs: 31 },
]

// DELETE /api/skus/[id] - Excluir SKU específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skuId = parseInt(params.id)
    
    if (isNaN(skuId)) {
      return NextResponse.json(
        { error: 'ID do SKU inválido' },
        { status: 400 }
      )
    }

    // Verificar se SKU existe
    const skuExists = mockStockItems.find(item => item.id === skuId)
    if (!skuExists) {
      return NextResponse.json(
        { error: 'SKU não encontrado' },
        { status: 404 }
      )
    }

    // Em produção seria algo como:
    // const sku = await db.query('SELECT * FROM stock_items WHERE id = $1', [skuId])
    // if (!sku.rows.length) return NextResponse.json({ error: 'SKU não encontrado' }, { status: 404 })
    
    // await db.query('DELETE FROM stock_items WHERE id = $1', [skuId])
    // await db.query('UPDATE clients SET total_skus = total_skus - 1 WHERE id = $1', [sku.rows[0].client_id])

    // Simulação: Remover o SKU
    mockStockItems = mockStockItems.filter(item => item.id !== skuId)
    
    // Atualizar contagem de SKUs do cliente
    mockClients = mockClients.map(client => 
      client.id === skuExists.clientId 
        ? { ...client, totalSKUs: Math.max(0, client.totalSKUs - 1) }
        : client
    )

    return NextResponse.json({
      message: 'SKU excluído com sucesso',
      sku: skuExists
    })

  } catch (error) {
    console.error('Erro ao excluir SKU:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}