import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { X, Globe, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { CREATE_SITE, type Site, type CreateSiteResponse } from '@/lib/graphql/site-operations'

interface AddSiteModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddSiteModal({ isOpen, onClose, onSuccess }: AddSiteModalProps) {
    const [name, setName] = useState('')
    const [domain, setDomain] = useState('')
    const [showApiKey, setShowApiKey] = useState(false)
    const [createdSite, setCreatedSite] = useState<any>(null)

    const [createSite, { loading, error }] = useMutation(CREATE_SITE, {
        onCompleted: (data) => {
            setCreatedSite(data.createSite)
            setShowApiKey(true)
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        await createSite({
            variables: {
                input: {
                    name,
                    domain: domain || undefined,
                },
            },
        })
    }

    const handleClose = () => {
        if (createdSite) {
            onSuccess()
        }
        onClose()
        // Reset form
        setTimeout(() => {
            setName('')
            setDomain('')
            setShowApiKey(false)
            setCreatedSite(null)
        }, 300)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {showApiKey ? 'Site Created!' : 'Add New Website'}
                            </h2>
                            <p className="text-purple-100 text-sm">
                                {showApiKey ? 'Save your API key securely' : 'Register a new site for tracking'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {!showApiKey ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Site Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Site Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Awesome Website"
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                            <p className="mt-2 text-xs text-gray-400">
                                A friendly name to identify your website
                            </p>
                        </div>

                        {/* Domain */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Domain (Optional)
                            </label>
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="example.com"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                            <p className="mt-2 text-xs text-gray-400">
                                The primary domain where you'll install the tracking script
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-4">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-white mb-2">What happens next?</h4>
                                    <ul className="text-xs text-gray-300 space-y-1">
                                        <li>• A unique Site ID and API key will be generated</li>
                                        <li>• You can install the tracking script on your website</li>
                                        <li>• Start crawling your website content for RAG</li>
                                        <li>• Track visitor behavior and intent in real-time</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-red-300">Error</h4>
                                    <p className="text-xs text-red-400 mt-1">{error.message}</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/30"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Globe className="w-5 h-5" />
                                        <span>Create Site</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Success Message */}
                        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6 text-center">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">Site Created Successfully!</h3>
                            <p className="text-gray-300">Your site has been registered and is ready to use</p>
                        </div>

                        {/* Site Details */}
                        <div className="space-y-4">
                            <div className="bg-gray-800 rounded-xl p-4">
                                <label className="block text-xs font-medium text-gray-400 mb-2">Site Name</label>
                                <div className="text-white font-medium">{createdSite?.name}</div>
                            </div>

                            <div className="bg-gray-800 rounded-xl p-4">
                                <label className="block text-xs font-medium text-gray-400 mb-2">Site ID</label>
                                <div className="text-white font-mono text-sm">{createdSite?.siteId}</div>
                            </div>

                            {createdSite?.domain && (
                                <div className="bg-gray-800 rounded-xl p-4">
                                    <label className="block text-xs font-medium text-gray-400 mb-2">Domain</label>
                                    <div className="text-white">{createdSite?.domain}</div>
                                </div>
                            )}

                            {/* API Key */}
                            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-4">
                                <div className="flex items-start space-x-3 mb-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                                    <div>
                                        <label className="block text-sm font-medium text-yellow-300 mb-1">
                                            API Key (Keep this secure!)
                                        </label>
                                        <p className="text-xs text-yellow-200/70">
                                            This will only be shown once. Copy it now!
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-white break-all">
                                    {createdSite?.apiKey}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(createdSite?.apiKey)}
                                    className="mt-3 w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Copy API Key
                                </button>
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <h4 className="text-sm font-medium text-white mb-3">Next Steps</h4>
                            <ol className="text-xs text-gray-300 space-y-2">
                                <li className="flex items-start space-x-2">
                                    <span className="text-purple-400 font-bold">1.</span>
                                    <span>Copy and save your API key in a secure location</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-purple-400 font-bold">2.</span>
                                    <span>Install the tracking script on your website</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-purple-400 font-bold">3.</span>
                                    <span>Start crawling your website to index content</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-purple-400 font-bold">4.</span>
                                    <span>Monitor visitor behavior and AI-powered insights</span>
                                </li>
                            </ol>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-purple-500/30"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
