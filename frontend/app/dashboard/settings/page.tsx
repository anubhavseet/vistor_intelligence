'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import DashboardLayout from '@/components/DashboardLayout'
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe } from 'lucide-react'

export default function SettingsPage() {
    const router = useRouter()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const user = useAuthStore((state) => state.user)

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated()) {
        return null
    }

    const settingsSections = [
        {
            title: 'Account Settings',
            icon: User,
            description: 'Manage your account details and preferences',
            items: [
                { label: 'Full Name', value: user?.name || 'Not set' },
                { label: 'Email Address', value: user?.email || 'Not set' },
                { label: 'Account Type', value: 'Professional' },
            ]
        },
        {
            title: 'Notifications',
            icon: Bell,
            description: 'Configure notification preferences',
            items: [
                { label: 'Email Notifications', value: 'Enabled' },
                { label: 'Crawl Completion Alerts', value: 'Enabled' },
                { label: 'Weekly Reports', value: 'Enabled' },
            ]
        },
        {
            title: 'Security',
            icon: Shield,
            description: 'Password and authentication settings',
            items: [
                { label: 'Two-Factor Authentication', value: 'Disabled' },
                { label: 'Last Password Change', value: 'Never' },
                { label: 'Active Sessions', value: '1' },
            ]
        },
        {
            title: 'Appearance',
            icon: Palette,
            description: 'Customize your dashboard theme',
            items: [
                { label: 'Theme', value: 'Dark (Default)' },
                { label: 'Accent Color', value: 'Purple' },
                { label: 'Font Size', value: 'Medium' },
            ]
        },
        {
            title: 'API & Integration',
            icon: Globe,
            description: 'API keys and webhook configurations',
            items: [
                { label: 'API Rate Limit', value: '10,000/day' },
                { label: 'Webhooks Configured', value: '0' },
                { label: 'Active Integrations', value: '0' },
            ]
        },
    ]

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                            <SettingsIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Settings</h1>
                            <p className="text-gray-300 text-lg">
                                Manage your account and application preferences
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {settingsSections.map((section, idx) => (
                        <div
                            key={idx}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-start space-x-4 mb-6">
                                <div className="p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl">
                                    <section.icon className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{section.title}</h3>
                                    <p className="text-sm text-gray-400">{section.description}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {section.items.map((item, itemIdx) => (
                                    <div
                                        key={itemIdx}
                                        className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                                    >
                                        <span className="text-sm text-gray-300">{item.label}</span>
                                        <span className="text-sm font-medium text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all font-medium">
                                Configure {section.title}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Danger Zone */}
                <div className="mt-8 bg-red-900/20 border-2 border-red-500/30 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-300 mb-6">
                        Irreversible and destructive actions
                    </p>
                    <div className="space-y-4">
                        <button className="w-full px-4 py-3 bg-red-900/30 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-900/50 transition-all font-medium text-left">
                            Export All Data
                        </button>
                        <button className="w-full px-4 py-3 bg-red-900/30 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-900/50 transition-all font-medium text-left">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
