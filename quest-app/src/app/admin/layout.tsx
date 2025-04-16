import { ReactNode } from 'react'
import AuthGuard from '@/components/authGuard'
import NavBarAdmin from '@/components/ui/navBarAdmin'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard adminOnly={true}>
        <NavBarAdmin />
        <main>{children}</main>
    </AuthGuard>
  )
}