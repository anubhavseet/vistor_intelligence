import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, User, Laptop, Mail, Globe, Bell, BarChart3 } from "lucide-react"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <div className="grid gap-6">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Theme
                            </label>
                            <div className="mt-2 grid max-w-md grid-cols-3 gap-2">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${theme === 'light' ? 'border-primary bg-accent' : 'border-muted'}`}
                                >
                                    <Sun className="mb-2 h-6 w-6" />
                                    <span className="text-xs font-medium">Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${theme === 'dark' ? 'border-primary bg-accent' : 'border-muted'}`}
                                >
                                    <Moon className="mb-2 h-6 w-6" />
                                    <span className="text-xs font-medium">Dark</span>
                                </button>
                                <button
                                    onClick={() => setTheme("system")}
                                    className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${theme === 'system' ? 'border-primary bg-accent' : 'border-muted'}`}
                                >
                                    <Laptop className="mb-2 h-6 w-6" />
                                    <span className="text-xs font-medium">System</span>
                                </button>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Customize how Tracker looks on your device.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <Bell className="w-5 h-5 text-primary" />
                        <div>
                            <h2 className="text-lg font-semibold">Notifications</h2>
                            <p className="text-sm text-muted-foreground">Manage how you receive alerts</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { name: 'Email Alerts', desc: 'Receive daily summaries and critical alerts via email', icon: Mail },
                            { name: 'Browser Push', desc: 'Get real-time push notifications for urgent events', icon: Globe },
                            { name: 'Weekly Reports', desc: 'Weekly analytics insights delivered every Monday', icon: BarChart3 }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-muted/20 border border-transparent hover:border-border transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-background rounded-full shadow-sm">
                                        <item.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-6 shadow-sm opacity-50 pointer-events-none">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Account Profile</h2>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
                                <User className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <div className="h-4 w-32 bg-muted rounded mb-2"></div>
                                <div className="h-3 w-48 bg-muted rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
