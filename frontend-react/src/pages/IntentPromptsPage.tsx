import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { toast } from 'react-toastify'
import {
    GET_INTENT_PROMPTS,
    CREATE_INTENT_PROMPT,
    UPDATE_INTENT_PROMPT,
    DELETE_INTENT_PROMPT,
    GENERATE_PROMPT_PREVIEW,
    type IntentPrompt,
    type GeneratePromptPreviewResult
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
    Wand2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function IntentPromptsPage() {
    const { siteId } = useParams<{ siteId: string }>()
    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showFullPreview, setShowFullPreview] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        intent: 'high_intent',
        prompt: '',
        description: '',
        generatedHtml: '',
        generatedCss: '',
        generatedJs: '',
        isActive: true
    })
    const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'css' | 'js'>('preview')

    const { data, loading, error, refetch } = useQuery<{ getIntentPrompts: IntentPrompt[] }>(GET_INTENT_PROMPTS, {
        variables: { siteId },
        skip: !siteId
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

    const resetForm = () => {
        setFormData({
            intent: 'high_intent',
            prompt: '',
            description: '',
            generatedHtml: '',
            generatedCss: '',
            generatedJs: '',
            isActive: true
        })
        setActiveTab('preview')
        setShowFullPreview(false)
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
                        generatedJs: formData.generatedJs
                    }
                }
            })
        } else {
            // Creation doesn't accept generated fields manually
            await createPrompt({
                variables: {
                    input: {
                        siteId,
                        intent: formData.intent,
                        prompt: formData.prompt,
                        description: formData.description,
                        isActive: formData.isActive
                    }
                }
            })
        }
    }

    const startEdit = (prompt: IntentPrompt) => {
        setEditingId(prompt.id)
        setFormData({
            intent: prompt.intent,
            prompt: prompt.prompt,
            description: prompt.description || '',
            generatedHtml: prompt.generatedHtml || '',
            generatedCss: prompt.generatedCss || '',
            generatedJs: prompt.generatedJs || '',
            isActive: prompt.isActive
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
                prompt: formData.prompt
            }
        })
    }

    const formatHtml = () => {
        if (!formData.generatedHtml) return;
        try {
            // Very basic formatter
            let formatted = '';
            let indent = 0;
            // Remove cleaner newlines first to restart
            const clean = formData.generatedHtml.replace(/>\s+</g, '><').trim();
            // Split by tags
            const parts = clean.split(/(<\/?[^>]+>)/g).filter(Boolean);

            parts.forEach(part => {
                if (part.match(/^<\//)) { // Closing tag
                    indent = Math.max(0, indent - 1);
                    formatted += '  '.repeat(indent) + part + '\n';
                } else if (part.match(/^<[^/].*\/>$/) || part.match(/^<(input|img|br|hr|meta|link)/)) { // Self closing or void
                    formatted += '  '.repeat(indent) + part + '\n';
                } else if (part.match(/^<[^/]/)) { // Opening tag
                    formatted += '  '.repeat(indent) + part + '\n';
                    indent++;
                } else { // Text content
                    formatted += '  '.repeat(indent) + part.trim() + '\n';
                }
            });

            setFormData(prev => ({ ...prev, generatedHtml: formatted.trim() }));
            toast.success('HTML Formatted');
        } catch (e) {
            console.error(e);
            toast.error('Could not format HTML');
        }
    }

    const formatCss = () => {
        if (!formData.generatedCss) return;
        try {
            const formatted = formData.generatedCss
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/\{\s*/g, ' {\n  ') // Indent open brace
                .replace(/;\s*/g, ';\n  ') // Indent semicolons
                .replace(/\}\s*/g, '\n}\n') // Newline close brace
                .replace(/\n\s*\n/g, '\n') // Remove empty lines
                .trim();
            setFormData(prev => ({ ...prev, generatedCss: formatted }));
            toast.success('CSS Formatted');
        } catch (e) {
            console.error(e);
            toast.error('Could not format CSS');
        }
    }

    const formatJs = () => {
        if (!formData.generatedJs) return;
        try {
            const formatted = formData.generatedJs
                .replace(/\s+/g, ' ')
                .replace(/\{/g, ' {\n  ')
                .replace(/;/g, ';\n')
                .replace(/\}/g, '\n}\n')
                .trim();
            setFormData(prev => ({ ...prev, generatedJs: formatted }));
            toast.success('JS Formatted');
        } catch (e) {
            console.error(e);
            toast.error('Could not format JS');
        }
    }

    const getPreviewSrcDoc = () => {
        // Simple escape for script tags to prevent breaking the preview HTML
        const safeJs = formData.generatedJs ? formData.generatedJs.replace(/<\/script>/gi, '<\\/script>') : '';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <!-- Load Fonts -->
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <!-- Tailwind -->
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    /* Basic Reset & Font */
                    *, *::before, *::after { box-sizing: border-box; }
                    body { 
                        margin: 0; 
                        padding: 1rem; 
                        font-family: 'Inter', system-ui, -apple-system, sans-serif; 
                        background-color: transparent; /* Allow iframe bg to show through or be white */
                    }
                    
                    /* Error Banner */
                    #vi-preview-error {
                        display: none;
                        background-color: #fee2e2;
                        border: 1px solid #ef4444;
                        color: #b91c1c;
                        padding: 0.75rem;
                        border-radius: 0.5rem;
                        margin-bottom: 1rem;
                        font-size: 0.875rem;
                        white-space: pre-wrap;
                    }

                    /* Custom AI Generated CSS */
                    ${formData.generatedCss}
                </style>
            </head>
            <body>
                <div id="vi-preview-error"></div>
                ${formData.generatedHtml || '<div class="text-gray-500 text-center p-4">No content generated yet.</div>'}
                
                <script>
                    // Error Handling
                    window.onerror = function(msg, url, lineNo, columnNo, error) {
                        const errorDiv = document.getElementById('vi-preview-error');
                        errorDiv.style.display = 'block';
                        errorDiv.textContent = 'Preview Error: ' + msg;
                        console.error('Preview Error:', error);
                        return false;
                    };

                    // Execute AI Generated JS safely
                    document.addEventListener('DOMContentLoaded', () => {
                        try {
                            console.log("Executing AI Generated JS...");
                            ${safeJs}
                        } catch(e) {
                            console.error("AI JS Runtime Error:", e);
                            const errorDiv = document.getElementById('vi-preview-error');
                            errorDiv.style.display = 'block';
                            errorDiv.textContent = 'JS Runtime Error: ' + e.message;
                        }
                    });
                </script>
            </body>
            </html>
        `
    }

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
                                <p className="text-xs text-muted-foreground">Test responsivness by resizing window</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFullPreview(false)}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                            title="Close Preview"
                        >
                            <Minimize2 className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 container mx-auto rounded-xl overflow-hidden shadow-2xl bg-white border outline outline-4 outline-muted/20">
                        <iframe
                            title="Full Design Preview"
                            srcDoc={getPreviewSrcDoc()}
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Intent Prompts</h1>
                    <p className="text-muted-foreground">Configure how AI responds to different user intents.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => { setIsCreating(true); resetForm(); }}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Prompt
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">{editingId ? 'Edit Prompt' : 'Create New Prompt'}</h2>
                        <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Intent Category</label>
                                <select
                                    value={formData.intent}
                                    onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="high_intent">High Intent (Lead)</option>
                                    <option value="bounce_risk">Bounce Risk</option>
                                    <option value="hesitation">Hesitation / Confusion</option>
                                    <option value="researcher">Researcher (Deep Reader)</option>
                                    <option value="custom">Custom Intent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <div className="flex items-center space-x-2 h-10">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                            formData.isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                                        )}
                                    >
                                        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", formData.isActive ? 'translate-x-6' : 'translate-x-1')} />
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
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('preview')}
                                                className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", activeTab === 'preview' ? "bg-background shadow-sm" : "hover:text-foreground/80 text-muted-foreground")}
                                            >
                                                Preview
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('html')}
                                                className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", activeTab === 'html' ? "bg-background shadow-sm" : "hover:text-foreground/80 text-muted-foreground")}
                                            >
                                                HTML
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('css')}
                                                className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", activeTab === 'css' ? "bg-background shadow-sm" : "hover:text-foreground/80 text-muted-foreground")}
                                            >
                                                CSS
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('js')}
                                                className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", activeTab === 'js' ? "bg-background shadow-sm" : "hover:text-foreground/80 text-muted-foreground")}
                                            >
                                                JS
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {activeTab === 'preview' && (
                                            <button
                                                type="button"
                                                onClick={() => setShowFullPreview(true)}
                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                                                title="Full Screen Preview"
                                            >
                                                <Maximize2 className="h-4 w-4" />
                                            </button>
                                        )}
                                        {(activeTab !== 'preview') && (
                                            <button
                                                type="button"
                                                onClick={
                                                    activeTab === 'html' ? formatHtml :
                                                        activeTab === 'css' ? formatCss :
                                                            formatJs
                                                }
                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium"
                                                title="Format Code"
                                            >
                                                <Wand2 className="h-3.5 w-3.5" />
                                                Format
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="h-[300px]">
                                    {activeTab === 'preview' && (
                                        <iframe
                                            title="UI Preview"
                                            srcDoc={getPreviewSrcDoc()}
                                            className="w-full h-full border-0 bg-white"
                                            sandbox="allow-scripts"
                                        />
                                    )}
                                    {activeTab === 'html' && (
                                        <textarea
                                            value={formData.generatedHtml}
                                            onChange={(e) => setFormData({ ...formData, generatedHtml: e.target.value })}
                                            className="w-full h-full p-4 font-mono text-xs resize-none focus:outline-none bg-slate-950 text-slate-50"
                                            placeholder="<!-- HTML Content -->"
                                            spellCheck="false"
                                        />
                                    )}
                                    {activeTab === 'css' && (
                                        <textarea
                                            value={formData.generatedCss}
                                            onChange={(e) => setFormData({ ...formData, generatedCss: e.target.value })}
                                            className="w-full h-full p-4 font-mono text-xs resize-none focus:outline-none bg-slate-950 text-slate-50"
                                            placeholder="/* CSS Content */"
                                            spellCheck="false"
                                        />
                                    )}
                                    {activeTab === 'js' && (
                                        <textarea
                                            value={formData.generatedJs}
                                            onChange={(e) => setFormData({ ...formData, generatedJs: e.target.value })}
                                            className="w-full h-full p-4 font-mono text-xs resize-none focus:outline-none bg-slate-950 text-slate-50"
                                            placeholder="// JavaScript Content"
                                            spellCheck="false"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-2">
                            <button
                                type="button"
                                onClick={() => { setIsCreating(false); setEditingId(null); }}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating || updating}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                            >
                                {(creating || updating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Update Prompt' : 'Create Prompt'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.getIntentPrompts.map((prompt: IntentPrompt) => (
                    <div key={prompt.id} className={cn("group relative flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md", !prompt.isActive && "opacity-75 bg-muted/20")}>
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className={cn("p-2 rounded-lg", prompt.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
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
                                    <button
                                        onClick={() => handleDelete(prompt.id)}
                                        disabled={deleting}
                                        title={deleting ? "Deleting..." : "Delete"}
                                        className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="rounded-md bg-muted/50 p-3 text-xs font-mono text-muted-foreground line-clamp-4">
                                    {prompt.prompt}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center">
                                {prompt.isActive ? <Zap className="h-3 w-3 text-yellow-500 mr-1" fill="currentColor" /> : <div className="h-2 w-2 rounded-full bg-slate-300 mr-2" />}
                                {prompt.isActive ? 'Active' : 'Inactive'}
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
