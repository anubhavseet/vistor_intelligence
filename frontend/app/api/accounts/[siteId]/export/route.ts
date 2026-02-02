export async function GET(request: Request, { params }: { params: { siteId: string } }) {
  const siteId = params.siteId
  const backendUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace('/graphql', '') || 'http://localhost:3001'
  
  try {
    const response = await fetch(`${backendUrl}/accounts/${siteId}/export`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    })
    
    if (!response.ok) {
      return new Response('Failed to export', { status: response.status })
    }
    
    const csv = await response.text()
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="accounts-${siteId}-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    return new Response('Export failed', { status: 500 })
  }
}
