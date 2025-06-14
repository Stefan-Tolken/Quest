import { ReactNode } from 'react'
import { QuestProvider } from '@/context/questContext'
import { DataProvider } from '@/context/dataContext'
import { ToastProvider } from '@/components/ui/toast'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    // <AuthGuard>
    <ToastProvider>
      <QuestProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </QuestProvider>
    </ToastProvider>
    // </AuthGuard>
  )
}