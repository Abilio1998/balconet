import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(request: Request) {
  // 1. Security Check
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Get Data
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data')

  if (!data) {
    return new NextResponse('Missing data parameter', { status: 400 })
  }

  // 3. Fetch from External API
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(data)}`
    const response = await fetch(qrUrl)
    
    if (!response.ok) {
      throw new Error('Failed to fetch QR from external service')
    }

    const blob = await response.blob()
    const buffer = Buffer.from(await blob.arrayBuffer())

    // 4. Return as Image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('QR Proxy Error:', error)
    return new NextResponse('Error generating QR', { status: 500 })
  }
}
