import { Moon, Sun, ChevronLeft } from "lucide-react"
import { useTheme } from "../theme-provider"
import { useNavigate } from "react-router-dom"

export function Topbar() {
    const { theme, setTheme } = useTheme()
    const navigate = useNavigate()

    return (
        <header className="flex h-16 w-full items-center justify-between border-b bg-card px-6 text-card-foreground">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-accent"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Toggle Theme"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </button>
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                    U
                </div>
            </div>
        </header>
    )
}
