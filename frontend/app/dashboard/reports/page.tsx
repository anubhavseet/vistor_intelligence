'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import DashboardLayout from '@/components/DashboardLayout'
import { FileText, Download, Calendar, Filter, TrendingUp, Users, Globe, Activity } from 'lucide-react'

export default function ReportsPage() {
    const router = useRouter()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const [dateRange, setDateRange] = useState('last-30-days')
    const [reportType, setReportType] = useState('all')

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated()) {
        return null
    }

    const reportTypes = [
        {
            id: 'visitor-intelligence',
            name: 'Visitor Intelligence Report',
            description: 'Detailed visitor behavior and identification data',
            icon: Users,
            color: 'purple',
            size: '2.4 MB',
            lastGenerated: '2 hours ago'
        },
        {
            id: 'analytics',
            name: 'Analytics Summary',
            description: 'Traffic metrics, page views, and engagement stats',
            icon: TrendingUp,
            color: 'blue',
            size: '1.8 MB',
            lastGenerated: '5 hours ago'
        },
        {
            id: 'account-intelligence',
            name: 'Account Intelligence Report',
            description: 'Identified accounts and company information',
            icon: Globe,
            color: 'green',
            size: '3.1 MB',
            lastGenerated: '1 day ago'
        },
        {
            id: 'real-time',
            name: 'Real-time Activity Log',
            description: 'Live visitor activity and session data',
            icon: Activity,
            color: 'pink',
            size: '5.6 MB',
            lastGenerated: '30 minutes ago'
        },
    ]

    const scheduledReports = [
        {
            name: 'Weekly Summary',
            frequency: 'Every Monday at 9:00 AM',
            recipients: 'team@company.com',
            format: 'PDF',
            active: true
        },
        {
            name: 'Monthly Analytics',
            frequency: '1st of every month',
            recipients: 'executives@company.com',
            format: 'Excel',
            active: true
        },
    ]

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg">
                                <FileText className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white">Reports</h1>
                                <p className="text-gray-300 text-lg">
                                    Export and schedule data reports
                                </p>
                            </div>
                        </div>
                        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg flex items-center space-x-2">
                            <Download className="w-5 h-5" />
                            <span>Generate Custom Report</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Date Range
                            </label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="last-7-days">Last 7 Days</option>
                                <option value="last-30-days">Last 30 Days</option>
                                <option value="last-90-days">Last 90 Days</option>
                                <option value="this-year">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Report Type
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Data</option>
                                <option value="visitors">Visitors Only</option>
                                <option value="accounts">Accounts Only</option>
                                <option value="analytics">Analytics Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Available Reports */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Available Reports</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {reportTypes.map((report) => {
                            const Icon = report.icon
                            return (
                                <div
                                    key={report.id}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                                >
                                    <div className="flex items-start space-x-4 mb-4">
                                        <div className={`p-3 bg-${report.color}-500/20 rounded-xl`}>
                                            <Icon className={`w-6 h-6 text-${report.color}-400`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1">{report.name}</h3>
                                            <p className="text-sm text-gray-400">{report.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4 pt-4 border-t border-white/10">
                                        <div>Size: {report.size}</div>
                                        <div>Last Generated: {report.lastGenerated}</div>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all font-medium flex items-center justify-center space-x-2">
                                            <Download className="w-4 h-4" />
                                            <span>Download PDF</span>
                                        </button>
                                        <button className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-all font-medium">
                                            Excel
                                        </button>
                                        <button className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-all font-medium">
                                            CSV
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Scheduled Reports */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Scheduled Reports</h2>
                            <p className="text-sm text-gray-400">
                                Automatically send reports on a schedule
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Add Schedule</span>
                        </button>
                    </div>

                    {scheduledReports.length > 0 ? (
                        <div className="space-y-4">
                            {scheduledReports.map((report, idx) => (
                                <div key={idx} className="bg-gray-800/50 rounded-xl p-6 border border-white/10">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${report.active
                                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                    }`}>
                                                    {report.active ? 'Active' : 'Paused'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-400">Frequency:</span>
                                                    <p className="text-white mt-1">{report.frequency}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Recipients:</span>
                                                    <p className="text-white mt-1">{report.recipients}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Format:</span>
                                                    <p className="text-white mt-1">{report.format}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-4">
                                            <button className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-all text-sm">
                                                Edit
                                            </button>
                                            <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-gray-800/30 rounded-xl border border-dashed border-white/20">
                            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No scheduled reports</h3>
                            <p className="text-gray-400">
                                Set up automatic report generation and email delivery
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
