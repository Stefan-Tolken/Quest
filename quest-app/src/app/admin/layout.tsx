import { ReactNode } from 'react'
import AuthGuard from '@/components/authGuard'
import AdminNavbar from '@/components/ui/adminNavbar'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard adminOnly={true}>
        <AdminNavbar />
        <main>{children}</main>
    </AuthGuard>
  )
}