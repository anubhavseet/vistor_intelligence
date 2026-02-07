import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmationDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDestructive?: boolean
    isLoading?: boolean
}

export default function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    isLoading = false,
}: ConfirmationDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg max-w-md w-full border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start space-x-4">
                        <div className={cn(
                            "p-2 rounded-full",
                            isDestructive ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-primary/10 text-primary"
                        )}>
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">{title}</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={cn(
                                "flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50",
                                isDestructive
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
