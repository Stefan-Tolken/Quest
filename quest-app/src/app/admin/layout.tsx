import { ReactNode } from 'react'
import AuthGuard from '@/components/authGuard'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard adminOnly={true}>
        <main>{children}</main>
    </AuthGuard>
  )
}