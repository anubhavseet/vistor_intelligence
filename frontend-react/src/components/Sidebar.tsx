import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Globe,
    Activity,
    Users,
    TrendingUp,
    Settings,
    Zap,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Sparkles,
    Bell,
    Code,
    Webhook,
    FileText,
    UserCircle,
    MessageSquare
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface SidebarProps {
    currentSiteId?: string
}

interface NavItem {
    name: string
    href: string
    icon: any
    description: string
    requiresSite?: boolean
    badge?: string
    badgeColor?: string
}

interface NavSection {
    title: string
    items: NavItem[]
}

export default function Sidebar({ currentSiteId }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const { pathname } = useLocation()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const navigationSections: NavSection[] = [
        {
            title: 'Overview',
            items: [
                {
                    name: 'Dashboard',
                    href: '/dashboard',
                    icon: LayoutDashboard,
                    description: 'Overview & Stats'
                },
                {
                    name: 'Websites',
                    href: '/dashboard/sites',
                    icon: Globe,
                    description: 'Manage Sites'
                },
                {
                    name: 'Intent Prompts',
                    href: currentSiteId ? `/dashboard/sites/${currentSiteId}/prompts` : '/dashboard/intent-prompts',
                    icon: MessageSquare,
                    description: 'AI Behaviors'
                }]
        },
        {
            title: 'Site Analytics',
            items: [
                {
                    name: 'Live Tracking',
                    href: currentSiteId ? `/dashboard/${currentSiteId}` : '/dashboard',
                    icon: Activity,
                    description: 'Real-time Visitors',
                    requiresSite: true,
                    badge: 'Live',
                    badgeColor: 'green'
                },
                {
                    name: 'Intent Engine',
                    href: currentSiteId ? `/dashboard/${currentSiteId}?tab=intent` : '/dashboard',
                    icon: Sparkles,
                    description: 'AI-Powered Intent',
                    requiresSite: true,
                    badge: 'AI',
                    badgeColor: 'purple'
                },
                {
                    name: 'Analytics',
                    href: currentSiteId ? `/dashboard/${currentSiteId}?tab=analytics` : '/dashboard',
                    icon: TrendingUp,
                    description: 'Reports & Insights',
                    requiresSite: true
                },
                {
                    name: 'Accounts',
                    href: currentSiteId ? `/dashboard/${currentSiteId}?tab=accounts` : '/dashboard',
                    icon: Users,
                    description: 'Visitor Intelligence',
                    requiresSite: true
                },
                {
                    name: 'Alerts',
                    href: currentSiteId ? `/dashboard/${currentSiteId}?tab=alerts` : '/dashboard',
                    icon: Bell,
                    description: 'Notifications',
                    requiresSite: true
                }]
        },
        {
            title: 'Tools',
            items: [
                {
                    name: 'Website Crawling',
                    href: '/dashboard/crawling',
                    icon: Zap,
                    description: 'AI Content Indexing',
                    badge: 'RAG',
                    badgeColor: 'blue'
                },
                {
                    name: 'API & Webhooks',
                    href: '/dashboard/integrations',
                    icon: Webhook,
                    description: 'Integrations'
                },
                {
                    name: 'Tracking Code',
                    href: '/dashboard/tracking-code',
                    icon: Code,
                    description: 'Install Script'
                },
                {
                    name: 'Reports',
                    href: '/dashboard/reports',
                    icon: FileText,
                    description: 'Export Data'
                }]
        },
        {
            title: 'Settings',
            items: [
                {
                    name: 'Settings',
                    href: '/dashboard/settings',
                    icon: Settings,
                    description: 'Configuration'
                }]
        }
    ]

    return (
        <div
            className={`${collapsed ? 'w-20' : 'w-72'
                } bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 border-r border-white/10 flex flex-col transition-all duration-300 relative h-screen`}
        >
            {/* Logo */}
            <div className="p-6 border-b border-white/10 flex-shrink-0">
                <Link to="/dashboard" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-shadow">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                                Visitor Intel
                            </h1>
                            <p className="text-xs text-gray-400">AI Platform</p>
                        </div>
                    )}
                </Link>
            </div>

            {/* User Info */}
            {!collapsed && user && (
                <div className="px-6 py-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
                {navigationSections.map((section, sectionIdx) => (
                    <div key={sectionIdx}>
                        {!collapsed && (
                            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {section.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.requiresSite && currentSiteId && pathname?.startsWith(`/dashboard/${currentSiteId}`))
                                const isDisabled = item.requiresSite && !currentSiteId

                                return (
                                    <Link
                                        key={item.name}
                                        to={isDisabled ? '#' : item.href}
                                        className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group relative
                      ${isActive
                                                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 text-white shadow-lg shadow-purple-500/20'
                                                : isDisabled
                                                    ? 'text-gray-600 cursor-not-allowed opacity-50'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                            }
                    `}
                                        title={isDisabled ? 'Select a site first' : item.description}
                                        onClick={(e) => isDisabled && e.preventDefault()}
                                    >
                                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-purple-400' : ''}`} />

                                        {!collapsed && (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{item.name}</div>
                                                    <div className="text-xs opacity-60 truncate">{item.description}</div>
                                                </div>

                                                {item.badge && !isDisabled && (
                                                    <span
                                                        className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0
                               ${item.badgeColor === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                               ${item.badgeColor === 'purple' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
                               ${item.badgeColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}
                             `}
                                                    >
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </>
                                        )}

                                        {isActive && !collapsed && (
                                            <div className="absolute right-0 w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-400 rounded-l-full" />
                                        )}

                                        {collapsed && item.badge && !isDisabled && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-slate-900" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10 space-y-2 flex-shrink-0">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                    {!collapsed && <span className="text-sm font-medium">Logout</span>}
                </button>
            </div>

            {/* Collapse Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-24 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center hover:bg-slate-700 hover:border-purple-500/50 transition-all shadow-lg z-50"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                )}
            </button>
        </div>
    )
}
