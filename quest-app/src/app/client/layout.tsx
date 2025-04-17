import { ReactNode } from 'react'
import AuthGuard from '@/components/authGuard'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    // <AuthGuard>
        <main>{children}</main>
    // </AuthGuard>
  )
}