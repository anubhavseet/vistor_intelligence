import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate, useParams } from 'react-router-dom'
import { useSite } from '@/hooks/use-sites'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

import {
    Save,
    Trash2,
    RefreshCw,
    Globe,
    Shield,
    Database,
    Eye,
    MapPin,
    Activity,
    Copy,
    Check,
    AlertCircle,
    Plus,
    X
} from 'lucide-react'
import ConfirmationDialog from '../components/ConfirmationDialog'

export default function SiteSettingsPage() {
    const navigate = useNavigate()
    const { siteId } = useParams<{ siteId: string }>()
    const { isAuthenticated } = useAuth()

    const { site, loading, error, updateSite, deleteSite, regenerateApiKey, refetch } = useSite(siteId || '')

    // Form state
    const [name, setName] = useState('')
    const [domain, setDomain] = useState('')
    const [allowedDomains, setAllowedDomains] = useState<string[]>([])
    const [newDomain, setNewDomain] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [enableTracking, setEnableTracking] = useState(true)
    const [enableGeoLocation, setEnableGeoLocation] = useState(true)
    const [enableBehaviorTracking, setEnableBehaviorTracking] = useState(true)
    const [dataRetentionDays, setDataRetentionDays] = useState(90)
    const [trackingStartDelay, setTrackingStartDelay] = useState(0)
    const [usePreGeneratedIntentUI, setUsePreGeneratedIntentUI] = useState(false)

    const [showApiKey, setShowApiKey] = useState(false)
    const [copiedApiKey, setCopiedApiKey] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [regenerating, setRegenerating] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    useEffect(() => {
        if (site) {
            setName(site.name)
            setDomain(site.domain || '')
            setAllowedDomains(site.allowedDomains || [])
            setIsActive(site.isActive)
            setEnableTracking(site.settings.enableTracking)
            setEnableGeoLocation(site.settings.enableGeoLocation)
            setEnableBehaviorTracking(site.settings.enableBehaviorTracking)
            setDataRetentionDays(site.settings.dataRetentionDays)
            setTrackingStartDelay(site.settings.trackingStartDelay || 0)
            setUsePreGeneratedIntentUI(site.settings.usePreGeneratedIntentUI || false)
        }
    }, [site])

    if (!isAuthenticated) {
        return null
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading site settings...</p>
                </div>
            </div>
        )
    }

    if (error || !site) {
        return (
            <div className="p-8">
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-destructive mb-2">Error Loading Site</h3>
                    <p className="text-muted-foreground">{error?.message || 'Site not found'}</p>
                </div>
            </div>
        )
    }

    const handleSave = async () => {
        setUpdating(true)
        try {
            await updateSite({
                name,
                domain: domain || undefined,
                allowedDomains,
                isActive,
                settings: {
                    enableTracking,
                    enableGeoLocation,
                    enableBehaviorTracking,
                    dataRetentionDays,
                    trackingStartDelay,
                    usePreGeneratedIntentUI
                }
            })
            toast.success('Site updated successfully!')
            refetch()
        } catch (err: any) {
            toast.error('Failed to update site: ' + err.message)
        } finally {
            setUpdating(false)
        }
    }

    const handleDelete = () => {
        setShowDeleteConfirm(true)
    }

    const performDelete = async () => {
        setDeleting(true)
        try {
            await deleteSite()
            navigate('/dashboard/sites')
            toast.success('Site deleted successfully')
        } catch (err: any) {
            toast.error('Failed to delete site: ' + err.message)
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleRegenerateApiKey = async () => {
        if (confirm('Are you sure? This will invalidate your current API key and may break existing integrations.')) {
            setRegenerating(true)
            try {
                await regenerateApiKey()
                toast.success('API key regenerated successfully!')
                setShowApiKey(true)
                refetch()
            } catch (err: any) {
                toast.error('Failed to regenerate API key: ' + err.message)
            } finally {
                setRegenerating(false)
            }
        }
    }

    const handleAddDomain = () => {
        if (newDomain && !allowedDomains.includes(newDomain)) {
            setAllowedDomains([...allowedDomains, newDomain])
            setNewDomain('')
        }
    }

    const handleRemoveDomain = (domainToRemove: string) => {
        setAllowedDomains(allowedDomains.filter(d => d !== domainToRemove))
    }

    const copyApiKey = () => {
        navigator.clipboard.writeText(site.apiKey || '')
        setCopiedApiKey(true)
        setTimeout(() => setCopiedApiKey(false), 2000)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
                        <p className="text-muted-foreground">Site Settings & Configuration</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={updating}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        {updating ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Information */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <Globe className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold">Basic Information</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Site Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Primary Domain
                                </label>
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="example.com"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Site ID
                                </label>
                                <div className="rounded-md border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground">
                                    {site.siteId}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                <div>
                                    <div className="font-medium">Site Status</div>
                                    <div className="text-sm text-muted-foreground">Enable or disable tracking for this site</div>
                                </div>
                                <button
                                    onClick={() => setIsActive(!isActive)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        isActive ? 'bg-primary' : 'bg-muted-foreground'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            isActive ? 'translate-x-6' : 'translate-x-1'
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Allowed Domains */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <Shield className="w-5 h-5 text-green-500" />
                            <h2 className="text-lg font-semibold">Allowed Domains</h2>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                            Only track visitors from these domains. Leave empty to allow all domains.
                        </p>

                        <div className="space-y-3">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                                    placeholder="app.example.com"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <button
                                    onClick={handleAddDomain}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-10 px-4 py-2"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </button>
                            </div>

                            <div className="space-y-2">
                                {allowedDomains.map((d, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                        <span className="font-mono text-sm">{d}</span>
                                        <button
                                            onClick={() => handleRemoveDomain(d)}
                                            className="p-1 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {allowedDomains.length === 0 && (
                                    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                                        No allowed domains configured. All domains are allowed.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tracking Settings */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <Activity className="w-5 h-5 text-purple-500" />
                            <h2 className="text-lg font-semibold">Tracking Settings</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                <div className="flex items-center space-x-3">
                                    <Eye className="w-4 h-4 text-blue-500" />
                                    <div>
                                        <div className="font-medium">Enable Tracking</div>
                                        <div className="text-sm text-muted-foreground">Track visitor pageviews and sessions</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEnableTracking(!enableTracking)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        enableTracking ? 'bg-primary' : 'bg-muted-foreground'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            enableTracking ? 'translate-x-6' : 'translate-x-1'
                                        )}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                <div className="flex items-center space-x-3">
                                    <MapPin className="w-4 h-4 text-green-500" />
                                    <div>
                                        <div className="font-medium">Enable Geo-Location</div>
                                        <div className="text-sm text-muted-foreground">Track visitor location data</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEnableGeoLocation(!enableGeoLocation)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        enableGeoLocation ? 'bg-primary' : 'bg-muted-foreground'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            enableGeoLocation ? 'translate-x-6' : 'translate-x-1'
                                        )}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                <div className="flex items-center space-x-3">
                                    <Activity className="w-4 h-4 text-pink-500" />
                                    <div>
                                        <div className="font-medium">Enable Behavior Tracking</div>
                                        <div className="text-sm text-muted-foreground">Track clicks, scrolls, and interactions</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEnableBehaviorTracking(!enableBehaviorTracking)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        enableBehaviorTracking ? 'bg-primary' : 'bg-muted-foreground'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            enableBehaviorTracking ? 'translate-x-6' : 'translate-x-1'
                                        )}
                                    />
                                </button>
                            </div>

                            <div className="p-3 rounded-md border bg-muted/30">
                                <div className="flex items-center space-x-3 mb-3">
                                    <Database className="w-4 h-4 text-orange-500" />
                                    <div>
                                        <div className="font-medium">Data Retention Period</div>
                                        <div className="text-sm text-muted-foreground">How long to keep tracking data</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="range"
                                        min="30"
                                        max="365"
                                        step="30"
                                        value={dataRetentionDays}
                                        onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="font-semibold min-w-[80px]">
                                        {dataRetentionDays} days
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 rounded-md border bg-muted/30">
                                <div className="flex items-center space-x-3 mb-3">
                                    <Activity className="w-4 h-4 text-purple-500" />
                                    <div>
                                        <div className="font-medium">Tracking Start Delay</div>
                                        <div className="text-sm text-muted-foreground">Milliseconds to wait before starting tracking (e.g., 2000)</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="number"
                                        min="0"
                                        max="60000"
                                        step="100"
                                        value={trackingStartDelay}
                                        onChange={(e) => setTrackingStartDelay(parseInt(e.target.value))}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <span className="font-semibold min-w-[50px]">
                                        ms
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                <div className="flex items-center space-x-3">
                                    <Activity className="w-4 h-4 text-cyan-500" />
                                    <div>
                                        <div className="font-medium">Use Pre-Generated AI Intent UI</div>
                                        <div className="text-sm text-muted-foreground">Use pre-generated UI for faster performance instead of generating on-the-go</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUsePreGeneratedIntentUI(!usePreGeneratedIntentUI)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        usePreGeneratedIntentUI ? 'bg-primary' : 'bg-muted-foreground'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            usePreGeneratedIntentUI ? 'translate-x-6' : 'translate-x-1'
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* API Key */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">API Key</h3>

                        {showApiKey ? (
                            <div className="space-y-3">
                                <div className="rounded-md border bg-muted p-3 font-mono text-xs break-all">
                                    {site.apiKey}
                                </div>
                                <button
                                    onClick={copyApiKey}
                                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                >
                                    {copiedApiKey ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            <span>Copy API Key</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowApiKey(false)}
                                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                >
                                    Hide API Key
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowApiKey(true)}
                                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-10 px-4 py-2"
                            >
                                Show API Key
                            </button>
                        )}

                        <button
                            onClick={handleRegenerateApiKey}
                            disabled={regenerating}
                            className="w-full mt-3 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400"
                        >
                            {regenerating ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Regenerating...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    <span>Regenerate API Key</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Site Stats */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Site Information</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-muted-foreground">Created</div>
                                <div>{new Date(site.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Last Updated</div>
                                <div>{new Date(site.updatedAt).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Status</div>
                                <div className={cn("font-medium", site.isActive ? 'text-green-500' : 'text-destructive')}>
                                    {site.isActive ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                        <h3 className="text-lg font-bold text-destructive mb-4">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Deleting this site will disable tracking and permanently remove all associated data, including indexed content in Qdrant.
                        </p>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Site</span>
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={performDelete}
                title="Delete Project"
                message="Are you sure you want to delete this project? This will permanently delete the project and all associated Qdrant data."
                confirmText="Delete Project"
                isDestructive={true}
                isLoading={deleting}
            />
        </div>
    )
}
