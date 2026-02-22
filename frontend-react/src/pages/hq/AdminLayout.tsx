import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Shield, LayoutDashboard, Users, Globe, Activity,
    Webhook, LogOut, ChevronLeft, ChevronRight,
    Monitor, Zap, Bell, Search, Command, CreditCard, Receipt
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'

const navItems = [
    { to: '/hq/dashboard', icon: LayoutDashboard, label: 'Overview', description: 'Platform metrics' },
    { to: '/hq/users', icon: Users, label: 'Users', description: 'Manage accounts' },
    { to: '/hq/sites', icon: Globe, label: 'Sites', description: 'All tracked sites' },
    { to: '/hq/sessions', icon: Activity, label: 'Sessions', description: 'Live monitoring' },
    { to: '/hq/webhooks', icon: Webhook, label: 'Webhooks', description: 'Event delivery' },
    { to: '/hq/plans', icon: CreditCard, label: 'Plans', description: 'Subscription plans' },
    { to: '/hq/subscriptions', icon: Receipt, label: 'Subscriptions', description: 'User subscriptions' },
    { to: '/hq/system', icon: Monitor, label: 'System', description: 'Health & logs' },
]

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false)
    const { user, logout } = useAdminStore()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/hq')
    }

    const getCurrentPageTitle = () => {
        const current = navItems.find(item => location.pathname.startsWith(item.to))
        return current?.label || 'Admin HQ'
    }

    return (
        <div className="flex h-screen bg-[#030303] text-white overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 72 : 260 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col border-r border-white/[0.06] bg-[#050505] z-20 flex-shrink-0"
            >
                {/* Logo section */}
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 h-16 border-b border-white/[0.06]`}>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2.5"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
                                <Shield className="w-4.5 h-4.5 text-white" />
                            </div>
                            <div>
                                <span className="text-sm font-semibold tracking-tight">Admin HQ</span>
                                <span className="text-[9px] text-red-400 ml-1.5 font-mono">PRO</span>
                            </div>
                        </motion.div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
                            <Shield className="w-4.5 h-4.5 text-white" />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className={`${collapsed ? 'hidden' : 'block'} px-2 mb-3`}>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">Navigation</span>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative ${isActive
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                                } ${collapsed ? 'justify-center' : ''}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="admin-nav-indicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-r-full"
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-red-400' : ''}`} />
                                    {!collapsed && (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.label}</span>
                                            <span className="text-[10px] text-gray-600 group-hover:text-gray-500">{item.description}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="border-t border-white/[0.06] p-3 space-y-2">
                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] transition-all text-sm cursor-pointer justify-center"
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        {!collapsed && <span>Collapse</span>}
                    </button>

                    {/* User & Logout */}
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]`}>
                        <div className="w-7 h-7 bg-gradient-to-br from-red-500/30 to-orange-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-red-400 flex-shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{user?.name || 'Admin'}</p>
                                <p className="text-[10px] text-gray-600 truncate">{user?.email}</p>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#030303]/80 backdrop-blur-xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-white">{getCurrentPageTitle()}</h2>
                        <span className="text-[10px] text-gray-600 font-mono bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                            <Zap className="w-3 h-3 inline mr-1 text-amber-500" />
                            Live
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-gray-500 text-xs">
                            <Search className="w-3.5 h-3.5" />
                            <span>Search</span>
                            <kbd className="ml-4 px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] font-mono text-gray-600">
                                <Command className="w-2.5 h-2.5 inline" />K
                            </kbd>
                        </div>

                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-white/[0.04] rounded-lg transition-colors text-gray-500 hover:text-gray-300 cursor-pointer">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
