import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react'
import { toast } from 'react-toastify'
import {
    GET_INTENT_PROMPTS,
    CREATE_INTENT_PROMPT,
    UPDATE_INTENT_PROMPT,
    DELETE_INTENT_PROMPT,
    GENERATE_PROMPT_PREVIEW,
    GET_INTENT_PROMPT_PAGE_PREVIEW,
    REBUILD_INTENT_SELECTOR_MAP,
    GET_INTENT_SELECTORS,
    type IntentPrompt,
    type GeneratePromptPreviewResult,
    type IntentPagePreviewResult,
    type IntentSelectorEntry,
} from '@/lib/graphql/intent-prompts'
import {
    Plus,
    Edit2,
    Trash2,
    Bot,
    Zap,
    MessageSquare,
    X,
    Loader2,
    Sparkles,
    Maximize2,
    Minimize2,
    Wand2,
    RefreshCw,
    Map,
    Target,
    ChevronDown,
    ChevronRight,
    TrendingUp,
    Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IntentCategory } from '@/lib/enums'

// Color palette per semantic content category
const categoryColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    pricing: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    features: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
    testimonial: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', dot: 'bg-violet-500' },
    cta: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
    hero: { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800', dot: 'bg-pink-500' },
    faq: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
    docs: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', dot: 'bg-cyan-500' },
    contact: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', dot: 'bg-teal-500' },
    blog: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
    nav: { bg: 'bg-slate-50 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
    footer: { bg: 'bg-slate-50 dark:bg-slate-900/30', text: 'text-slate-600 dark:text-slate-500', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-300' },
    other: { bg: 'bg-gray-50 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700', dot: 'bg-gray-400' },
}

const getCategoryColor = (category: string) =>
    categoryColors[category.toLowerCase()] ??
    { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', dot: 'bg-violet-500' }

function ConfidenceBar({ value }: { value: number }) {
    const pct = Math.round((value ?? 0) * 100)
    const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400'
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-10 text-right">{pct}%</span>
        </div>
    )
}

export default function IntentPromptsPage() {
    const { siteId } = useParams<{ siteId: string }>()
    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showFullPreview, setShowFullPreview] = useState(false)
    const [showSelectorMap, setShowSelectorMap] = useState(false)
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
    const [selectorFilter, setSelectorFilter] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        intent: IntentCategory.HIGH_INTENT,
        prompt: '',
        description: '',
        generatedHtml: '',
        generatedCss: '',
        generatedJs: '',
        isActive: true,
        injectionMode: 'popup' as 'popup' | 'inline'
    })
    const [activeTab, setActiveTab] = useState<'preview' | 'page_preview' | 'html' | 'css' | 'js'>('preview')
    const [pagePreviewHtml, setPagePreviewHtml] = useState<string | null>(null)
    const [loadingPagePreview, setLoadingPagePreview] = useState(false)

    const { data, loading, error, refetch } = useQuery<{ getIntentPrompts: IntentPrompt[] }>(GET_INTENT_PROMPTS, {
        variables: { siteId },
        skip: !siteId
    })

    const { data: selectorData, loading: loadingSelectors, refetch: refetchSelectors } = useQuery<{ getIntentSelectors: IntentSelectorEntry[] }>(GET_INTENT_SELECTORS, {
        variables: { siteId },
        skip: !siteId || !showSelectorMap,
    })

    const [createPrompt, { loading: creating }] = useMutation(CREATE_INTENT_PROMPT, {
        onCompleted: () => {
            toast.success('Prompt created successfully')
            setIsCreating(false)
            resetForm()
            refetch()
        },
        onError: (err: Error) => toast.error(err.message)
    })

    const [updatePrompt, { loading: updating }] = useMutation(UPDATE_INTENT_PROMPT, {
        onCompleted: () => {
            toast.success('Prompt updated successfully')
            setEditingId(null)
            resetForm()
            refetch()
        },
        onError: (err: Error) => toast.error(err.message)
    })

    const [deletePrompt, { loading: deleting }] = useMutation(DELETE_INTENT_PROMPT, {
        onCompleted: () => {
            toast.success('Prompt deleted')
            refetch()
        },
        onError: (err: Error) => toast.error(err.message)
    })

    const [generatePreview, { loading: generatingPreview }] = useMutation<{ generatePromptPreview: GeneratePromptPreviewResult }>(GENERATE_PROMPT_PREVIEW, {
        onCompleted: (data) => {
            toast.success('Preview generated')
            setFormData(prev => ({
                ...prev,
                generatedHtml: data.generatePromptPreview.html,
                generatedCss: data.generatePromptPreview.css,
                generatedJs: data.generatePromptPreview.js || ''
            }))
            setActiveTab('preview')
        },
        onError: (err: Error) => toast.error('Failed to generate preview: ' + err.message)
    })

    const [rebuildSelectorMap, { loading: rebuilding }] = useMutation(REBUILD_INTENT_SELECTOR_MAP, {
        onCompleted: () => {
            toast.success('Intent Selector Map rebuilt! Refreshing...')
            refetchSelectors()
        },
        onError: (err: Error) => toast.error('Rebuild failed: ' + err.message)
    })

    const [fetchPagePreview] = useLazyQuery<{ getIntentPromptPagePreview: IntentPagePreviewResult }>(GET_INTENT_PROMPT_PAGE_PREVIEW, {
        fetchPolicy: 'network-only',
    })

    const resetForm = () => {
        setFormData({
            intent: IntentCategory.HIGH_INTENT,
            prompt: '',
            description: '',
            generatedHtml: '',
            generatedCss: '',
            generatedJs: '',
            isActive: true,
            injectionMode: 'popup'
        })
        setActiveTab('preview')
        setShowFullPreview(false)
        setPagePreviewHtml(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!siteId) return

        if (editingId) {
            await updatePrompt({
                variables: {
                    input: {
                        id: editingId,
                        intent: formData.intent,
                        prompt: formData.prompt,
                        description: formData.description,
                        isActive: formData.isActive,
                        generatedHtml: formData.generatedHtml,
                        generatedCss: formData.generatedCss,
                        generatedJs: formData.generatedJs,
                        injectionMode: formData.injectionMode,
                    }
                }
            })
        } else {
            await createPrompt({
                variables: {
                    input: {
                        siteId,
                        intent: formData.intent,
                        prompt: formData.prompt,
                        description: formData.description,
                        isActive: formData.isActive,
                        injectionMode: formData.injectionMode,
                    }
                }
            })
        }
    }

    const startEdit = (prompt: IntentPrompt) => {
        setEditingId(prompt.id)

        if (prompt.injectionMode === 'inline' && prompt.generatedHtml) {
            setActiveTab('page_preview')
            setTimeout(() => handlePagePreview(prompt.id), 100)
        } else {
            setActiveTab('preview')
        }

        setFormData({
            intent: prompt.intent as IntentCategory,
            prompt: prompt.prompt,
            description: prompt.description || '',
            generatedHtml: prompt.generatedHtml || '',
            generatedCss: prompt.generatedCss || '',
            generatedJs: prompt.generatedJs || '',
            isActive: prompt.isActive,
            injectionMode: (prompt.injectionMode as 'popup' | 'inline') || 'popup'
        })
        setIsCreating(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this prompt?')) {
            await deletePrompt({ variables: { id } })
        }
    }

    const handleGeneratePreview = async () => {
        if (!formData.prompt) {
            toast.error('Please enter a system prompt first')
            return
        }
        await generatePreview({
            variables: {
                siteId,
                intent: formData.intent,
                prompt: formData.prompt,
                injectionMode: formData.injectionMode,
                promptId: editingId || undefined,
            }
        })
    }

    const handleRebuildSelectorMap = async () => {
        if (!siteId) return
        if (!confirm('This will re-classify all crawled page elements using Gemini AI. This may take a moment. Continue?')) return
        await rebuildSelectorMap({ variables: { siteId } })
    }

    const handlePagePreview = async (promptId: string) => {
        if (!siteId || !promptId) return
        setLoadingPagePreview(true)
        setActiveTab('page_preview')
        try {
            const { data, error } = await fetchPagePreview({ variables: { siteId, promptId } })
            if (error) throw error
            setPagePreviewHtml(data?.getIntentPromptPagePreview?.pageHtml || '')
        } catch (e: any) {
            toast.error('Page preview failed: ' + (e?.message || 'Unknown error'))
        } finally {
            setLoadingPagePreview(false)
        }
    }

    const formatHtml = () => {
        if (!formData.generatedHtml) return
        try {
            let formatted = ''
            let indent = 0
            const clean = formData.generatedHtml.replace(/>\s+</g, '><').trim()
            const parts = clean.split(/(<\/?[^>]+>)/g).filter(Boolean)

            parts.forEach(part => {
                if (part.match(/^<\//)) {
                    indent = Math.max(0, indent - 1)
                    formatted += '  '.repeat(indent) + part + '\n'
                } else if (part.match(/^<[^/].*\/>$/) || part.match(/^<(input|img|br|hr|meta|link)/)) {
                    formatted += '  '.repeat(indent) + part + '\n'
                } else if (part.match(/^<[^/]/)) {
                    formatted += '  '.repeat(indent) + part + '\n'
                    indent++
                } else {
                    formatted += '  '.repeat(indent) + part.trim() + '\n'
                }
            })

            setFormData(prev => ({ ...prev, generatedHtml: formatted.trim() }))
            toast.success('HTML Formatted')
        } catch (e) {
            toast.error('Could not format HTML')
        }
    }

    const formatCss = () => {
        if (!formData.generatedCss) return
        try {
            const formatted = formData.generatedCss
                .replace(/\s+/g, ' ')
                .replace(/\{\s*/g, ' {\n  ')
                .replace(/;\s*/g, ';\n  ')
                .replace(/\}\s*/g, '\n}\n')
                .replace(/\n\s*\n/g, '\n')
                .trim()
            setFormData(prev => ({ ...prev, generatedCss: formatted }))
            toast.success('CSS Formatted')
        } catch (e) {
            toast.error('Could not format CSS')
        }
    }

    const formatJs = () => {
        if (!formData.generatedJs) return
        try {
            const formatted = formData.generatedJs
                .replace(/\s+/g, ' ')
                .replace(/\{/g, ' {\n  ')
                .replace(/;/g, ';\n')
                .replace(/\}/g, '\n}\n')
                .trim()
            setFormData(prev => ({ ...prev, generatedJs: formatted }))
            toast.success('JS Formatted')
        } catch (e) {
            toast.error('Could not format JS')
        }
    }

    const getPreviewSrcDoc = () => {
        const safeJs = formData.generatedJs ? formData.generatedJs.replace(/<\/script>/gi, '<\\/script>') : ''
        const safeHtml = formData.generatedHtml ? formData.generatedHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$') : ''
        const safeCss = formData.generatedCss ? formData.generatedCss.replace(/`/g, '\\`') : ''

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { margin: 0; padding: 20px; font-family: 'Inter', sans-serif; background: transparent; }
                    #vi-preview-root { position: relative; width: 100%; min-height: 200px; display: block; }
                    #vi-preview-error {
                        display: none; background-color: #fee2e2; border: 1px solid #ef4444; color: #b91c1c;
                        padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; white-space: pre-wrap; font-family: monospace;
                    }
                    ${safeCss}
                </style>
            </head>
            <body>
                <div id="vi-preview-error"></div>
                <div id="vi-preview-root"></div>
                <script>
                    const errorBanner = document.getElementById('vi-preview-error');
                    function showError(msg, source) {
                        errorBanner.style.display = 'block';
                        errorBanner.textContent += (source ? '[' + source + '] ' : '') + msg + '\\n';
                    }
                    window.onerror = function(msg, url, line) {
                        showError(msg + ' (Line ' + line + ')', 'Global');
                        return false;
                    };
                    try {
                        const host = document.getElementById('vi-preview-root');
                        host.innerHTML = \`${safeHtml || '<div style="color:#666;text-align:center;padding:20px;">No content generated.</div>'}\`;
                        const runUserScript = new Function('document', \`try { ${safeJs} } catch(e) { throw e; }\`);
                        runUserScript(document);
                    } catch (e) {
                        showError(e.message, 'Preview Initialization');
                    }
                </script>
            </body>
            </html>
        `
    }

    // ── Selector map derived state ─────────────────────────────────────────────
    const allEntries = selectorData?.getIntentSelectors ?? []

    // Filter: match against category name or any of the individual selectors
    const filteredEntries: IntentSelectorEntry[] = selectorFilter.trim()
        ? allEntries.reduce<IntentSelectorEntry[]>((acc, entry) => {
            const q = selectorFilter.toLowerCase()
            const matchedSelectors = entry.selectors.filter(s => s.toLowerCase().includes(q))
            if (entry.category.toLowerCase().includes(q) || matchedSelectors.length > 0) {
                acc.push({ ...entry, selectors: matchedSelectors.length > 0 ? matchedSelectors : entry.selectors })
            }
            return acc
        }, [])
        : allEntries

    const totalSelectors = allEntries.reduce((s, e) => s + e.selectors.length, 0)

    if (loading && !data) return <div className="p-8 text-center text-muted-foreground">Loading prompts...</div>
    if (error) return <div className="p-8 text-center text-destructive">Error: {error.message}</div>

    return (
        <div className="space-y-6">
            {/* Full Screen Preview Modal */}
            {showFullPreview && (
                <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4 container mx-auto bg-card rounded-lg p-3 border shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Full Design Preview</h2>
                                <p className="text-xs text-muted-foreground">Test responsiveness by resizing window</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFullPreview(false)}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <Minimize2 className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 container mx-auto rounded-xl overflow-hidden shadow-2xl bg-white border">
                        <iframe
                            title="Full Design Preview"
                            srcDoc={getPreviewSrcDoc()}
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Intent Prompts</h1>
                    <p className="text-muted-foreground">Configure how AI responds to different user intents.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSelectorMap(v => !v)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium border transition-colors',
                            showSelectorMap
                                ? 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700'
                                : 'bg-background text-foreground border-input hover:bg-muted'
                        )}
                    >
                        <Map className="h-4 w-4" />
                        Selector Map
                        {allEntries.length > 0 && (
                            <span className="ml-1 bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {allEntries.length}
                            </span>
                        )}
                    </button>
                    {!isCreating && (
                        <button
                            onClick={() => { setIsCreating(true); resetForm() }}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" />
                            New Prompt
                        </button>
                    )}
                </div>
            </div>

            {/* ── Intent Selector Map Panel ── */}
            {showSelectorMap && (
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <Map className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold">Intent Selector Map</h2>
                                <p className="text-xs text-muted-foreground">
                                    AI-classified CSS selectors crawled from your site — used to contextualise visitor intent scoring.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {totalSelectors > 0 && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                    {totalSelectors} selector{totalSelectors !== 1 ? 's' : ''} across {allEntries.length} categories
                                </span>
                            )}
                            <button
                                onClick={handleRebuildSelectorMap}
                                disabled={rebuilding}
                                className="inline-flex items-center gap-2 rounded-md bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-60 shadow-sm"
                            >
                                {rebuilding
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <RefreshCw className="h-4 w-4" />
                                }
                                {rebuilding ? 'Rebuilding...' : 'Rebuild with AI'}
                            </button>
                        </div>
                    </div>

                    {loadingSelectors ? (
                        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Loading selector map...</span>
                        </div>
                    ) : allEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                            <div className="p-4 bg-muted/50 rounded-full">
                                <Target className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium text-base">No selector map found</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                    Click "Rebuild with AI" to classify your site's CSS selectors by content category using Gemini.
                                </p>
                            </div>
                            <button
                                onClick={handleRebuildSelectorMap}
                                disabled={rebuilding}
                                className="inline-flex items-center gap-2 rounded-md bg-violet-600 text-white px-4 py-2 text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-60"
                            >
                                {rebuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                {rebuilding ? 'Building...' : 'Build Selector Map Now'}
                            </button>
                        </div>
                    ) : (
                        <div className="p-5 space-y-4">
                            {/* Stats pills */}
                            <div className="flex flex-wrap gap-2">
                                {allEntries
                                    .slice()
                                    .sort((a, b) => b.selectors.length - a.selectors.length)
                                    .map(entry => {
                                        const colors = getCategoryColor(entry.category)
                                        return (
                                            <button
                                                key={entry.category}
                                                type="button"
                                                onClick={() => setExpandedCategory(
                                                    expandedCategory === entry.category ? null : entry.category
                                                )}
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                                                    colors.bg, colors.text, colors.border,
                                                    expandedCategory === entry.category && 'ring-2 ring-offset-1 ring-current'
                                                )}
                                            >
                                                <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
                                                <span className="capitalize">{entry.category}</span>
                                                <span className="font-bold opacity-70">{entry.selectors.length}</span>
                                            </button>
                                        )
                                    })}
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by category or selector..."
                                    value={selectorFilter}
                                    onChange={e => setSelectorFilter(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                {selectorFilter && (
                                    <button
                                        onClick={() => setSelectorFilter('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Category cards */}
                            {filteredEntries.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No categories match your search.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredEntries
                                        .slice()
                                        .sort((a, b) => b.selectors.length - a.selectors.length)
                                        .map(entry => {
                                            const colors = getCategoryColor(entry.category)
                                            const isOpen = expandedCategory === entry.category || expandedCategory === null
                                            return (
                                                <div key={entry.category} className="rounded-lg border overflow-hidden">
                                                    {/* Category row */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedCategory(
                                                            expandedCategory === entry.category ? null : entry.category
                                                        )}
                                                        className={cn('w-full flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-90 text-left', colors.bg)}
                                                    >
                                                        <div className={cn('w-3 h-3 rounded-full shrink-0', colors.dot)} />
                                                        <span className={cn('capitalize text-sm font-semibold flex-1', colors.text)}>
                                                            {entry.category}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <TrendingUp className="h-3.5 w-3.5" />
                                                                {Math.round((entry.confidence ?? 0) * 100)}% confidence
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Tag className="h-3.5 w-3.5" />
                                                                {entry.selectors.length} selector{entry.selectors.length !== 1 ? 's' : ''}
                                                            </span>
                                                            {isOpen
                                                                ? <ChevronDown className={cn('h-4 w-4', colors.text)} />
                                                                : <ChevronRight className={cn('h-4 w-4', colors.text)} />
                                                            }
                                                        </div>
                                                    </button>

                                                    {/* Selectors list */}
                                                    {isOpen && (
                                                        <div className="divide-y">
                                                            {/* Confidence bar spanning full width */}
                                                            <div className="px-4 py-2 bg-muted/20 flex items-center gap-4">
                                                                <span className="text-xs text-muted-foreground w-24 shrink-0">AI Confidence</span>
                                                                <ConfidenceBar value={entry.confidence ?? 0} />
                                                            </div>
                                                            {entry.selectors.map((selector, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center gap-3 px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors group"
                                                                >
                                                                    <code className="flex-1 text-xs font-mono text-foreground break-all">
                                                                        {selector}
                                                                    </code>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(selector)
                                                                            toast.success('Selector copied!')
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-all"
                                                                    >
                                                                        Copy
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Create / Edit Form ── */}
            {isCreating && (
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">{editingId ? 'Edit Prompt' : 'Create New Prompt'}</h2>
                        <button onClick={() => { setIsCreating(false); setEditingId(null) }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Intent Category</label>
                                <select
                                    value={formData.intent}
                                    onChange={(e) => setFormData({ ...formData, intent: e.target.value as IntentCategory })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {Object.values(IntentCategory).map((category) => (
                                        <option key={category} value={category}>
                                            {category.toLowerCase().replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Injection Mode</label>
                                <div className="flex items-center gap-2 h-10">
                                    <div className="flex rounded-md border border-input overflow-hidden text-sm">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, injectionMode: 'popup' })}
                                            className={cn('px-3 py-2 transition-colors', formData.injectionMode === 'popup' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted')}
                                        >
                                            Popup
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, injectionMode: 'inline' })}
                                            className={cn('px-3 py-2 transition-colors border-l border-input', formData.injectionMode === 'inline' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted')}
                                        >
                                            Inline
                                        </button>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formData.injectionMode === 'inline' ? 'Flows in page content' : 'Fixed overlay popup'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <div className="flex items-center space-x-2 h-10">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        className={cn(
                                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                            formData.isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                                        )}
                                    >
                                        <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', formData.isActive ? 'translate-x-6' : 'translate-x-1')} />
                                    </button>
                                    <span className="text-sm text-muted-foreground">{formData.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="E.g., Discount popup for hesitant users"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">System Prompt</label>
                            <textarea
                                value={formData.prompt}
                                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                placeholder="Instructions for the AI on what UI to generate..."
                                rows={5}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Tips: Describe the UI component, tone, and call-to-action. The system will inject context automatically.
                            </p>
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={handleGeneratePreview}
                                    disabled={generatingPreview || !formData.prompt}
                                    className="inline-flex items-center justify-center rounded-md bg-violet-100 text-violet-700 px-3 py-1.5 text-xs font-medium hover:bg-violet-200 transition-colors disabled:opacity-50"
                                >
                                    {generatingPreview ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
                                    Generate Preview using AI
                                </button>
                            </div>
                        </div>

                        {/* Generated UI Section */}
                        {(editingId || formData.generatedHtml) && (
                            <div className="border rounded-md overflow-hidden bg-background">
                                <div className="border-b bg-muted/30 px-4 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-sm font-medium">Generated UI Template</h3>
                                        <div className="flex bg-muted rounded-md p-0.5">
                                            <button type="button" onClick={() => setActiveTab('preview')} className={cn('px-3 py-1 text-xs font-medium rounded-sm transition-all', activeTab === 'preview' ? 'bg-background shadow-sm' : 'hover:text-foreground/80 text-muted-foreground')}>Preview</button>
                                            {editingId && (
                                                <button type="button" onClick={() => setActiveTab('page_preview')} className={cn('px-3 py-1 text-xs font-medium rounded-sm transition-all flex items-center gap-1', activeTab === 'page_preview' ? 'bg-background shadow-sm' : 'hover:text-foreground/80 text-muted-foreground')}>
                                                    <Maximize2 className="h-3 w-3" />In Page
                                                </button>
                                            )}
                                            <button type="button" onClick={() => setActiveTab('html')} className={cn('px-3 py-1 text-xs font-medium rounded-sm transition-all', activeTab === 'html' ? 'bg-background shadow-sm' : 'hover:text-foreground/80 text-muted-foreground')}>HTML</button>
                                            <button type="button" onClick={() => setActiveTab('css')} className={cn('px-3 py-1 text-xs font-medium rounded-sm transition-all', activeTab === 'css' ? 'bg-background shadow-sm' : 'hover:text-foreground/80 text-muted-foreground')}>CSS</button>
                                            <button type="button" onClick={() => setActiveTab('js')} className={cn('px-3 py-1 text-xs font-medium rounded-sm transition-all', activeTab === 'js' ? 'bg-background shadow-sm' : 'hover:text-foreground/80 text-muted-foreground')}>JS</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {activeTab === 'preview' && (
                                            <button type="button" onClick={() => setShowFullPreview(true)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors" title="Full Screen">
                                                <Maximize2 className="h-4 w-4" />
                                            </button>
                                        )}
                                        {activeTab !== 'preview' && activeTab !== 'page_preview' && (
                                            <button type="button" onClick={activeTab === 'html' ? formatHtml : activeTab === 'css' ? formatCss : formatJs} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium">
                                                <Wand2 className="h-3.5 w-3.5" />Format
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="h-[300px]">
                                    {activeTab === 'preview' && <iframe title="UI Preview" srcDoc={getPreviewSrcDoc()} className="w-full h-full border-0 bg-white" sandbox="allow-scripts" />}
                                    {activeTab === 'page_preview' && (
                                        <div className="relative w-full h-full">
                                            {loadingPagePreview ? (
                                                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span className="text-sm">Loading page preview from Qdrant...</span>
                                                </div>
                                            ) : pagePreviewHtml ? (
                                                <iframe title="In-Page Preview" srcDoc={pagePreviewHtml} className="w-full h-full border-0" sandbox="allow-scripts" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                                                    <Maximize2 className="h-8 w-8 text-muted-foreground/50" />
                                                    <p className="text-sm text-muted-foreground">Click "Load Page Preview" to see the component in context</p>
                                                    {editingId && (
                                                        <button type="button" onClick={() => handlePagePreview(editingId)} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors">
                                                            <Maximize2 className="h-3 w-3" />Load Page Preview
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === 'html' && <textarea value={formData.generatedHtml} onChange={(e) => setFormData({ ...formData, generatedHtml: e.target.value })} className="w-full h-full p-4 font-mono text-xs resize-none focus:outline-none bg-slate-950 text-slate-50" placeholder="<!-- HTML Content -->" spellCheck="false" />}
                                    {activeTab === 'css' && <textarea value={formData.generatedCss} onChange={(e) => setFormData({ ...formData, generatedCss: e.target.value })} className="w-full h-full p-4 font-mono text-xs resize-none focus:outline-none bg-slate-950 text-slate-50" placeholder="/* CSS Content */" spellCheck="false" />}
                                    {activeTab === 'js' && <textarea value={formData.generatedJs} onChange={(e) => setFormData({ ...formData, generatedJs: e.target.value })} className="w-full h-full p-4 font-mono text-xs resize-none focus:outline-none bg-slate-950 text-slate-50" placeholder="// JavaScript Content" spellCheck="false" />}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-2">
                            <button type="button" onClick={() => { setIsCreating(false); setEditingId(null) }} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                Cancel
                            </button>
                            <button type="submit" disabled={creating || updating} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50">
                                {(creating || updating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Update Prompt' : 'Create Prompt'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Prompt Cards Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.getIntentPrompts.map((prompt: IntentPrompt) => (
                    <div key={prompt.id} className={cn('group relative flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md', !prompt.isActive && 'opacity-75 bg-muted/20')}>
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className={cn('p-2 rounded-lg', prompt.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold capitalize">{prompt.intent.replace('_', ' ')}</h3>
                                        {prompt.description && <p className="text-xs text-muted-foreground">{prompt.description}</p>}
                                    </div>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(prompt)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(prompt.id)} disabled={deleting} className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="rounded-md bg-muted/50 p-3 text-xs font-mono text-muted-foreground line-clamp-4">
                                    {prompt.prompt}
                                </div>
                                {(prompt.generatedTargetSelector || prompt.generatedInjectionPosition) && (
                                    <div className="rounded-md bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900 p-2.5 space-y-1">
                                        {prompt.generatedTargetSelector && (
                                            <div className="flex items-center gap-2">
                                                <Target className="h-3 w-3 text-violet-500 shrink-0" />
                                                <code className="text-xs text-violet-700 dark:text-violet-400 font-mono break-all">{prompt.generatedTargetSelector}</code>
                                            </div>
                                        )}
                                        {prompt.generatedInjectionPosition && (
                                            <div className="flex items-center gap-2">
                                                <Maximize2 className="h-3 w-3 text-violet-500 shrink-0" />
                                                <span className="text-xs text-violet-600 dark:text-violet-400">{prompt.generatedInjectionPosition}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-2">
                                {prompt.isActive ? <Zap className="h-3 w-3 text-yellow-500 mr-1" fill="currentColor" /> : <div className="h-2 w-2 rounded-full bg-slate-300 mr-2" />}
                                {prompt.isActive ? 'Active' : 'Inactive'}
                                <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', prompt.injectionMode === 'inline' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600')}>
                                    {prompt.injectionMode === 'inline' ? 'Inline' : 'Popup'}
                                </span>
                            </span>
                            <span>{new Date(prompt.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}

                {data?.getIntentPrompts.length === 0 && !isCreating && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg">
                        <div className="bg-muted/50 p-4 rounded-full mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No intent prompts defined</h3>
                        <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                            Create custom prompts to tell the AI how to react when it detects specific user behaviors.
                        </p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Prompt
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
