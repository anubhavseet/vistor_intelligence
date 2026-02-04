'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { useAuthStore } from '@/lib/auth-store'
import DashboardLayout from '@/components/DashboardLayout'
import {
    Settings,
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
import {
    GET_SITE,
    UPDATE_SITE,
    DELETE_SITE,
    REGENERATE_API_KEY,
    type GetSiteResponse,
    type Site
} from '@/lib/graphql/site-operations'

export default function SiteSettingsPage() {
    const router = useRouter()
    const params = useParams()
    const siteId = params.siteId as string
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

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

    const [showApiKey, setShowApiKey] = useState(false)
    const [copiedApiKey, setCopiedApiKey] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // GraphQL
    const { data, loading, error, refetch } = useQuery<GetSiteResponse>(GET_SITE, {
        variables: { siteId },
        skip: !isAuthenticated() || !siteId,
        onCompleted: (data) => {
            const site = data.getSite
            setName(site.name)
            setDomain(site.domain || '')
            setAllowedDomains(site.allowedDomains || [])
            setIsActive(site.isActive)
            setEnableTracking(site.settings.enableTracking)
            setEnableGeoLocation(site.settings.enableGeoLocation)
            setEnableBehaviorTracking(site.settings.enableBehaviorTracking)
            setDataRetentionDays(site.settings.dataRetentionDays)
        }
    })

    const [updateSite, { loading: updating }] = useMutation(UPDATE_SITE, {
        onCompleted: () => {
            alert('Site updated successfully!')
            refetch()
        }
    })

    const [deleteSite, { loading: deleting }] = useMutation(DELETE_SITE, {
        onCompleted: () => {
            router.push('/dashboard/sites')
        }
    })

    const [regenerateApiKey, { loading: regenerating }] = useMutation(REGENERATE_API_KEY, {
        onCompleted: () => {
            alert('API key regenerated successfully!')
            setShowApiKey(true)
            refetch()
        }
    })

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated()) {
        return null
    }

    if (loading) {
        return (
            <DashboardLayout currentSiteId={siteId}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Loading site settings...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (error || !data?.getSite) {
        return (
            <DashboardLayout currentSiteId={siteId}>
                <div className="p-8">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Error Loading Site</h3>
                        <p className="text-gray-400">{error?.message || 'Site not found'}</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    const site = data.getSite

    const handleSave = async () => {
        await updateSite({
            variables: {
                siteId,
                input: {
                    name,
                    domain: domain || undefined,
                    allowedDomains,
                    isActive,
                    settings: {
                        enableTracking,
                        enableGeoLocation,
                        enableBehaviorTracking,
                        dataRetentionDays
                    }
                }
            }
        })
    }

    const handleDelete = async () => {
        if (showDeleteConfirm) {
            await deleteSite({ variables: { siteId } })
        } else {
            setShowDeleteConfirm(true)
            setTimeout(() => setShowDeleteConfirm(false), 5000)
        }
    }

    const handleRegenerateApiKey = async () => {
        if (confirm('Are you sure? This will invalidate your current API key and may break existing integrations.')) {
            await regenerateApiKey({ variables: { siteId } })
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
        <DashboardLayout currentSiteId={siteId}>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                                <Settings className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white">{site.name}</h1>
                                <p className="text-gray-300 text-lg">Site Settings & Configuration</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={updating}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg flex items-center space-x-2 disabled:opacity-50"
                        >
                            {updating ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
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
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Globe className="w-6 h-6 text-blue-400" />
                                <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Site Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Primary Domain
                                    </label>
                                    <input
                                        type="text"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        placeholder="example.com"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Site ID
                                    </label>
                                    <div className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 font-mono text-sm">
                                        {site.siteId}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-white">Site Status</div>
                                        <div className="text-sm text-gray-400">Enable or disable tracking for this site</div>
                                    </div>
                                    <button
                                        onClick={() => setIsActive(!isActive)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-green-600' : 'bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Allowed Domains */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Shield className="w-6 h-6 text-green-400" />
                                <h2 className="text-2xl font-bold text-white">Allowed Domains</h2>
                            </div>

                            <p className="text-sm text-gray-400 mb-4">
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
                                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        onClick={handleAddDomain}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {allowedDomains.map((d, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                            <span className="text-white font-mono text-sm">{d}</span>
                                            <button
                                                onClick={() => handleRemoveDomain(d)}
                                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {allowedDomains.length === 0 && (
                                        <div className="text-center p-8 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                                            No allowed domains configured. All domains are allowed.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tracking Settings */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Activity className="w-6 h-6 text-purple-400" />
                                <h2 className="text-2xl font-bold text-white">Tracking Settings</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Eye className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <div className="font-medium text-white">Enable Tracking</div>
                                            <div className="text-sm text-gray-400">Track visitor pageviews and sessions</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEnableTracking(!enableTracking)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableTracking ? 'bg-purple-600' : 'bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableTracking ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <MapPin className="w-5 h-5 text-green-400" />
                                        <div>
                                            <div className="font-medium text-white">Enable Geo-Location</div>
                                            <div className="text-sm text-gray-400">Track visitor location data</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEnableGeoLocation(!enableGeoLocation)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableGeoLocation ? 'bg-purple-600' : 'bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableGeoLocation ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Activity className="w-5 h-5 text-pink-400" />
                                        <div>
                                            <div className="font-medium text-white">Enable Behavior Tracking</div>
                                            <div className="text-sm text-gray-400">Track clicks, scrolls, and interactions</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEnableBehaviorTracking(!enableBehaviorTracking)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableBehaviorTracking ? 'bg-purple-600' : 'bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableBehaviorTracking ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="p-4 bg-gray-800/50 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Database className="w-5 h-5 text-orange-400" />
                                        <div>
                                            <div className="font-medium text-white">Data Retention Period</div>
                                            <div className="text-sm text-gray-400">How long to keep tracking data</div>
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
                                        <span className="text-white font-semibold min-w-[80px]">
                                            {dataRetentionDays} days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* API Key */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4">API Key</h3>

                            {showApiKey ? (
                                <div className="space-y-3">
                                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 font-mono text-xs text-white break-all">
                                        {site.apiKey}
                                    </div>
                                    <button
                                        onClick={copyApiKey}
                                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    >
                                        {copiedApiKey ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                <span>Copy API Key</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowApiKey(false)}
                                        className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                    >
                                        Hide API Key
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowApiKey(true)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all font-medium"
                                >
                                    Show API Key
                                </button>
                            )}

                            <button
                                onClick={handleRegenerateApiKey}
                                disabled={regenerating}
                                className="w-full mt-3 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {regenerating ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Regenerating...</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Regenerate API Key</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Site Stats */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Site Information</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="text-gray-400">Created</div>
                                    <div className="text-white">{new Date(site.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400">Last Updated</div>
                                    <div className="text-white">{new Date(site.updatedAt).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400">Status</div>
                                    <div className={`font-medium ${site.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                        {site.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Deleting this site will disable tracking and remove all associated data.
                            </p>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className={`w-full px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center space-x-2 ${showDeleteConfirm
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                    }`}
                            >
                                {deleting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>{showDeleteConfirm ? 'Click Again to Confirm' : 'Delete Site'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
