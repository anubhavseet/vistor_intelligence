import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Download, Calendar, Users, Globe, Activity, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReportsPage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [dateRange, setDateRange] = useState('last-30-days')
    const [reportType, setReportType] = useState('all')

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    if (!isAuthenticated) {
        return null
    }

    const reportTypes = [
        {
            id: 'visitor-intelligence',
            name: 'Visitor Intelligence Report',
            description: 'Detailed visitor behavior and identification data',
            icon: Users,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            size: '2.4 MB',
            lastGenerated: '2 hours ago'
        },
        {
            id: 'analytics',
            name: 'Analytics Summary',
            description: 'Traffic metrics, page views, and engagement stats',
            icon: TrendingUp,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            size: '1.8 MB',
            lastGenerated: '5 hours ago'
        },
        {
            id: 'account-intelligence',
            name: 'Account Intelligence Report',
            description: 'Identified accounts and company information',
            icon: Globe,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            size: '3.1 MB',
            lastGenerated: '1 day ago'
        },
        {
            id: 'real-time',
            name: 'Real-time Activity Log',
            description: 'Live visitor activity and session data',
            icon: Activity,
            color: 'text-pink-500',
            bgColor: 'bg-pink-500/10',
            size: '5.6 MB',
            lastGenerated: '30 minutes ago'
        }]

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
        }]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Export and schedule data reports.</p>
                </div>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Custom Report
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="last-7-days">Last 7 Days</option>
                            <option value="last-30-days">Last 30 Days</option>
                            <option value="last-90-days">Last 90 Days</option>
                            <option value="this-year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Report Type
                        </label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div>
                <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {reportTypes.map((report) => {
                        const Icon = report.icon
                        return (
                            <div
                                key={report.id}
                                className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-start space-x-4 mb-4">
                                    <div className={cn("p-2 rounded-lg", report.bgColor)}>
                                        <Icon className={cn("w-6 h-6", report.color)} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{report.name}</h3>
                                        <p className="text-sm text-muted-foreground">{report.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pt-4 border-t">
                                    <div>Size: {report.size}</div>
                                    <div>Last Generated: {report.lastGenerated}</div>
                                </div>

                                <div className="flex space-x-2">
                                    <button className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </button>
                                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                        Excel
                                    </button>
                                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                        CSV
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Scheduled Reports */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Scheduled Reports</h2>
                        <p className="text-sm text-muted-foreground">
                            Automatically send reports on a schedule
                        </p>
                    </div>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2">
                        <Calendar className="mr-2 h-4 w-4" />
                        Add Schedule
                    </button>
                </div>

                {scheduledReports.length > 0 ? (
                    <div className="space-y-4">
                        {scheduledReports.map((report, idx) => (
                            <div key={idx} className="rounded-md border p-4 bg-muted/50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h3 className="font-semibold">{report.name}</h3>
                                            <span className={cn(
                                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent",
                                                report.active
                                                    ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                                    : "bg-gray-500/15 text-gray-700 dark:text-gray-400"
                                            )}>
                                                {report.active ? 'Active' : 'Paused'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Frequency:</span>
                                                <p className="font-medium mt-1">{report.frequency}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Recipients:</span>
                                                <p className="font-medium mt-1">{report.recipients}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Format:</span>
                                                <p className="font-medium mt-1">{report.format}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                            Edit
                                        </button>
                                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-destructive/10 hover:text-destructive h-9 px-3 text-destructive">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed p-12 text-center">
                        <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold">No scheduled reports</h3>
                        <p className="text-muted-foreground">
                            Set up automatic report generation and email delivery.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
