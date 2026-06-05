import { getAuthToken, API_BASE } from '@/lib/api/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { gymId: string; templateId: string } }
) {
  const format = request.nextUrl.searchParams.get('format') ?? 'xlsx'
  const token = await getAuthToken()

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const backendUrl = `${API_BASE}/api/gyms/${params.gymId}/coach/templates/${params.templateId}/export?format=${format}`

  const backendRes = await fetch(backendUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  if (!backendRes.ok) {
    return new NextResponse(null, { status: backendRes.status })
  }

  const contentType = backendRes.headers.get('Content-Type') ?? 'application/octet-stream'
  const contentDisposition = backendRes.headers.get('Content-Disposition') ?? `attachment; filename="rutina.${format}"`
  const body = await backendRes.arrayBuffer()

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
    },
  })
}
