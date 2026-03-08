import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { protectPage } from "@/lib/with-module-protection"
import IntegrityClientPage from './page.client'

export default async function IntegrityPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')
    if (!await protectPage('ADMIN')) return redirect('/dashboard')

    return <IntegrityClientPage />
}
