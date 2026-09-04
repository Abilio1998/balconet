import PublicLoyalty from '@/components/loyalty/PublicLoyalty'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mis Puntos | El Balconet Rewards',
  description: 'Consulta tus puntos de fidelización y premios disponibles en El Balconet.',
  robots: 'noindex, nofollow' // We don't want this indexed by search engines
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PuntosPage(props: Props) {
  const searchParams = await props.searchParams
  const token = typeof searchParams.token === 'string' ? searchParams.token : null

  return (
    <main className="bg-[#0A0A0A]">
      <PublicLoyalty token={token} />
    </main>
  )
}
