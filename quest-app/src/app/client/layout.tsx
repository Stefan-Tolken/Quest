import { ReactNode } from 'react'
import AuthGuard from '@/components/authGuard'
import { QuestProvider } from '@/context/questContext'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    // <AuthGuard>
    <QuestProvider>
        <main>{children}</main>
    </QuestProvider>
    // </AuthGuard>
  )
}