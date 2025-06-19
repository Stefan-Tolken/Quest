import { ReactNode } from 'react'
import AuthGuard from '@/components/authGuard'
import AdminNavbar from '@/components/ui/adminNavbar'
import { DataProvider } from '@/context/dataContext'
import { NavigationGuardProvider } from "@/context/NavigationGuardContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <AuthGuard adminOnly={true}>
          <NavigationGuardProvider>
            <AdminNavbar />
            <main className='pt-20'>{children}</main>
          </NavigationGuardProvider>
      </AuthGuard>
    </DataProvider>
  )
}