import { ReactNode } from 'react'
import AuthGuard from '@/components/authGuard'
import NavBarClient from '@/components/ui/navBarClient'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <NavBarClient />
        <main>{children}</main>
    </AuthGuard>
  )
}