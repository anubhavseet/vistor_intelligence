import { NavLink } from "react-router-dom";
import { LayoutDashboard, Globe, Settings, LogOut, Code, Puzzle, BarChart3, LineChart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "@/store/auth-store";

interface SidebarProps {
    isCollapsed: boolean;
    toggle: () => void;
}

export function Sidebar({ isCollapsed, toggle }: SidebarProps) {
    const { logout } = useAuthStore()

    type NavigationItem = {
        name: string;
        href?: string;
        icon?: any;
        children?: NavigationItem[];
    }

    const navigation: NavigationItem[] = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        {
            name: "Sites",
            icon: Globe,
            children: [
                { name: "All Sites", href: "/dashboard/sites", icon: Globe },
                { name: "Crawling", href: "/dashboard/crawling", icon: Globe },
                { name: "Tracking Code", href: "/dashboard/tracking-code", icon: Code },
                { name: "Integrations", href: "/dashboard/integrations", icon: Puzzle },
            ]
        },
        {
            name: "Analytics",
            icon: BarChart3,
            children: [
                { name: "Overview", href: "/dashboard/reports", icon: BarChart3 },
                { name: "Site Analytics", href: "/dashboard/site-analytics", icon: LineChart },
            ]
        },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];

    return (
        <div className={cn(
            "flex h-full flex-col border-r bg-card text-card-foreground transition-all duration-300 ease-in-out relative",
            isCollapsed ? "w-16" : "w-64"
        )}>
            <div className={cn("flex h-16 items-center px-4", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && <h1 className="text-xl font-bold tracking-tight">Tracker</h1>}
                <button
                    onClick={toggle}
                    className="p-1 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
                {navigation.map((item) => {
                    if (item.children) {
                        return (
                            <div key={item.name} className="py-2">
                                {!isCollapsed && (
                                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                        {item.name}
                                    </h3>
                                )}
                                {isCollapsed && (
                                    <div className="mb-2 w-full h-px bg-border/50" />
                                )}

                                <div className="space-y-1">
                                    {item.children.map((child) => (
                                        <NavLink
                                            key={child.name}
                                            to={child.href!}
                                            title={isCollapsed ? child.name : undefined}
                                            className={({ isActive }) =>
                                                cn(
                                                    "group flex items-center rounded-md py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                    isCollapsed ? "justify-center px-0" : "px-2",
                                                    isActive
                                                        ? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-400 border-r-2 border-violet-500"
                                                        : "text-muted-foreground"
                                                )
                                            }
                                        >
                                            {child.icon ? (
                                                <child.icon className={cn("h-4 w-4 flex-shrink-0", isCollapsed ? "" : "mr-3")} />
                                            ) : (
                                                <span className={cn("h-4 w-4 flex-shrink-0", isCollapsed ? "" : "mr-3")} />
                                            )}
                                            {!isCollapsed && <span className="truncate">{child.name}</span>}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={item.name}
                            to={item.href!}
                            end={item.href === "/dashboard"}
                            title={isCollapsed ? item.name : undefined}
                            className={({ isActive }) =>
                                cn(
                                    "group flex items-center rounded-md py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    isCollapsed ? "justify-center px-0" : "px-2",
                                    isActive
                                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                                        : "text-muted-foreground"
                                )
                            }
                        >
                            <item.icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed ? "" : "mr-3")} />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </NavLink>
                    );
                })}
            </nav>
            <div className="border-t p-3">
                <button
                    className={cn(
                        "flex w-full items-center rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                        isCollapsed ? "justify-center px-0" : "px-2"
                    )}
                    onClick={() => {
                        logout()

                    }}
                    title="Logout"
                >
                    <LogOut className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}
