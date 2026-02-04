import { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
    children: ReactNode
    currentSiteId?: string
}

export default function DashboardLayout({ children, currentSiteId }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
            <Sidebar currentSiteId={currentSiteId} />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
