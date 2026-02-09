import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Sparkles,
    ArrowRight,
    Check,
    ChevronRight,
    Search,
    BrainCircuit,
    Layers,
    Activity,
    Lock,
    Code2,
    Zap,
    Users,
    Globe,
    ShieldCheck,
    BarChart3
} from 'lucide-react'

// --- Components ---

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-black/50 backdrop-blur-xl border-white/10' : 'bg-transparent border-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-black translate-y-[1px]" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">VisitorIntel</span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    {['Features', 'Methodology', 'Pricing', 'Docs'].map((item) => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                            {item}
                        </a>
                    ))}
                </div>

                <div className="flex items-center space-x-4">
                    <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Log In</Link>
                    <Link
                        to="/register"
                        className="px-4 py-2 bg-white text-black text-sm font-semibold rounded hover:bg-gray-200 transition-colors"
                    >
                        Start Free Trial
                    </Link>
                </div>
            </div>
        </nav>
    )
}

const Hero = () => {
    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, 500], [0, 100])

    return (
        <section className="relative min-h-screen pt-32 pb-20 flex flex-col justify-center overflow-hidden border-b border-white/10">
            {/* Vercel-style Grid Background */}
            <div className="absolute inset-0 bg-grid-small [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
            <div className="absolute inset-0 hero-glow pointer-events-none" />

            <div className="container relative z-10 mx-auto px-6 text-center max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-400 mb-8 font-mono"
                >
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>v2.0: Now with Intent Pattern Recognition</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50"
                >
                    Turn anonymous visitors<br />
                    into revenue.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                >
                    We analyze <span className="text-white">behavior patterns</span> to predict intent without invading privacy. Identification without surveillance.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-20"
                >
                    <Link
                        to="/register"
                        className="h-12 px-8 rounded bg-white text-black font-semibold flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors w-full sm:w-auto"
                    >
                        <span>Start Deploying</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        to="/contact"
                        className="h-12 px-8 rounded border border-white/20 text-white font-medium flex items-center justify-center hover:bg-white/5 transition-colors w-full sm:w-auto"
                    >
                        Contact Sales
                    </Link>
                </motion.div>

                {/* Technical Visualization */}
                <motion.div style={{ y }} className="relative max-w-4xl mx-auto">
                    <div className="rounded-xl border border-white/10 bg-black shadow-2xl overflow-hidden aspect-[16/9]">
                        <div className="h-10 border-b border-white/10 bg-[#111] flex items-center px-4 space-x-2">
                            <div className="flex space-x-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#333]" />
                                <div className="w-3 h-3 rounded-full bg-[#333]" />
                                <div className="w-3 h-3 rounded-full bg-[#333]" />
                            </div>
                            <div className="flex-1 text-center text-xs ml-4 text-gray-500 font-mono">dashboard.visitorintel.com</div>
                        </div>
                        <div className="p-8 grid grid-cols-3 gap-6 h-full bg-black relative">
                            {/* Grid overlay inside the dashboard */}
                            <div className="absolute inset-0 bg-grid-small opacity-20 pointer-events-none" />

                            {/* Left Panel - Code/Logs */}
                            <div className="col-span-1 border border-white/10 rounded-lg bg-black p-4 font-mono text-xs space-y-2 overflow-hidden relative">
                                <div className="text-gray-500 mb-2">// Active Session Stream</div>
                                <div className="text-green-500">GET /pricing <span className="text-gray-600">200 OK</span></div>
                                <div className="text-gray-500">User dwells &gt; 45s</div>
                                <div className="text-blue-500">Intent Score Updated: 82</div>
                                <div className="text-green-500">GET /api-docs <span className="text-gray-600">200 OK</span></div>
                                <div className="text-gray-500">Pattern Match: "Developer"</div>
                                <div className="text-purple-500">Trigger: Sales Alert</div>
                                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black to-transparent" />
                            </div>

                            {/* Right Panel - Visualization */}
                            <div className="col-span-2 border border-white/10 rounded-lg bg-black flex flex-col items-center justify-center relative">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,112,243,0.1),transparent)]" />
                                <div className="w-32 h-32 rounded-full border border-blue-500/30 flex items-center justify-center relative z-10">
                                    <div className="w-24 h-24 rounded-full border border-blue-500/60 flex items-center justify-center animate-pulse">
                                        <div className="text-2xl font-bold text-blue-500">92</div>
                                    </div>
                                </div>
                                <div className="mt-4 text-sm font-mono text-gray-400">HIGH INTENT SIGNAL DETECTED</div>
                                <div className="mt-2 text-xs font-mono text-gray-500">Microsoft Corp • Redmond, WA</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

const Marquee = () => {
    const companies = ["Github", "Vercel", "Stripe", "Linear", "Raycast", "OpenAI", "Airbnb", "Shopify"]
    return (
        <section className="py-12 border-b border-white/10 overflow-hidden bg-black">
            <div className="max-w-7xl mx-auto px-6 text-center mb-8">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Trusted by data-driven teams</span>
            </div>
            <div className="flex w-full overflow-hidden mask-fade-sides">
                <div className="flex animate-marquee space-x-16 min-w-full">
                    {[...companies, ...companies, ...companies].map((company, i) => (
                        <span key={i} className="text-xl font-bold text-gray-700 font-sans tracking-tight hover:text-white transition-colors cursor-default">
                            {company}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

const Features = () => {
    return (
        <section id="features" className="py-32 bg-black relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-24">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Intelligence that <span className="text-blue-500">acts</span>.</h2>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        We don't just observe behavior. We give you the tools to shape it dynamically.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[minmax(300px,auto)]">

                    {/* Feature 1: AI Generative UI Injection (Large) */}
                    <div className="md:col-span-4 row-span-2 border border-white/10 rounded-xl bg-[#050505] p-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-small opacity-10" />
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <Zap className="w-5 h-5 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-bold">Generative UI Injection</h3>
                            </div>
                            <p className="text-gray-400 max-w-lg mb-8">
                                The AI doesn't just score intent; it reacts to it. Automatically inject custom, AI-generated HTML/CSS components—like specialized pricing banners or meeting schedulers—tailored to the visitor's industry and behavior.
                            </p>

                            {/* Visual: Code Injection Simulation */}
                            <div className="flex-1 mt-4 rounded-lg border border-white/10 bg-[#0A0A0A] p-4 font-mono text-xs overflow-hidden relative">
                                <div className="absolute top-0 left-0 right-0 h-8 bg-[#111] border-b border-white/5 flex items-center px-4 space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                    <span className="text-gray-500 ml-2">dom_injector.js</span>
                                </div>
                                <div className="pt-8 space-y-2 text-gray-400">
                                    <div><span className="text-purple-400">if</span> (visitor.intent &gt; <span className="text-blue-400">85</span> && visitor.industry === <span className="text-green-400">'Fintech'</span>) {'{'}</div>
                                    <div className="pl-4 text-gray-500">// AI generates and injects this component</div>
                                    <div className="pl-4"><span className="text-yellow-400">const</span> overlay = <span className="text-blue-400">await</span> Gemini.generateUI(<span className="text-green-400">'Enterprise_CTA'</span>);</div>
                                    <div className="pl-4">document.body.appendChild(overlay);</div>
                                    <div>{'}'}</div>
                                </div>
                                {/* Floating injected element visual */}
                                <motion.div
                                    className="absolute bottom-4 right-4 bg-[#111] border border-blue-500/30 p-4 rounded-lg shadow-2xl max-w-[200px]"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 1 }}
                                >
                                    <div className="text-blue-400 font-bold mb-1">Book a Demo</div>
                                    <div className="text-[10px] text-gray-400">We help Fintech teams like yours scale.</div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Intent Prompts (Tall) */}
                    <div className="md:col-span-2 row-span-2 border border-white/10 rounded-xl bg-[#050505] p-8 relative overflow-hidden group">
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                    <Code2 className="w-5 h-5 text-purple-500" />
                                </div>
                                <h3 className="text-2xl font-bold">Natural Language Prompts</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">
                                Define complex tracking logic using plain English. No more GTM tags or regex.
                            </p>

                            <div className="flex-1 bg-[#111] rounded-lg border border-white/10 p-4 relative">
                                <div className="text-[10px] uppercase text-gray-500 mb-2 font-mono">Prompt Editor</div>
                                <div className="text-gray-300 font-mono text-sm">
                                    "Alert me when a user from a Fortune 500 company spends more than 30 seconds on the API documentation and copies a code snippet."
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded border border-blue-500/30">Fortune 500</span>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] rounded border border-green-500/30">Time &gt; 30s</span>
                                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] rounded border border-yellow-500/30">Action: Copy</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: IP Heatmaps */}
                    <div className="md:col-span-3 row-span-1 border border-white/10 rounded-xl bg-[#050505] p-8 relative overflow-hidden group">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                <ShieldCheck className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold">Account-Level Heatmaps</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Visualize exactly where employees from specific target accounts (e.g., "Uber HQ") are clicking and scrolling on your site.
                        </p>
                        <div className="absolute right-0 bottom-0 opacity-20">
                            <Activity className="w-32 h-32 text-red-500" />
                        </div>
                    </div>

                    {/* Feature 4: Granular Analytics */}
                    <div className="md:col-span-3 row-span-1 border border-white/10 rounded-xl bg-[#050505] p-8 relative overflow-hidden group">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                <BarChart3 className="w-5 h-5 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold">Deep Interaction Forensics</h3>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Track micro-interactions that signal interest: text selection, rage clicks, scroll velocity, and copy-paste events.
                        </p>
                        <div className="mt-4 flex gap-4 text-xs font-mono text-gray-500">
                            <div className="flex items-center"><Check className="w-3 h-3 mr-1 text-green-500" /> Text Selection</div>
                            <div className="flex items-center"><Check className="w-3 h-3 mr-1 text-green-500" /> Rage Clicks</div>
                            <div className="flex items-center"><Check className="w-3 h-3 mr-1 text-green-500" /> Dwell Time</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

const MethodologyWaitlist = () => {
    return (
        <section id="methodology" className="py-32 border-t border-white/10 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                <div>
                    <div className="text-blue-500 font-mono text-xs mb-4">THE METHODOLOGY</div>
                    <h2 className="text-4xl font-bold mb-6">We track patterns, not names.</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Traditional tools rely on cookies and creeping on individual people. We take a different approach. By analyzing the *shape* of a session—the rapid scroll through pricing, the copy-paste of an API key, the forwarding of a URL—we detect intent at the account level.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-mono text-xs border border-blue-500/20">1</div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Company Identification</h4>
                                <p className="text-sm text-gray-400">We identify which organization is visiting (e.g., "Netflix") using IP intelligence.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-mono text-xs border border-blue-500/20">2</div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Behavioral Analysis</h4>
                                <p className="text-sm text-gray-400">We score their actions (e.g., visited /pricing 3x) to determine intent.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-mono text-xs border border-blue-500/20">3</div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Revenue Signal</h4>
                                <p className="text-sm text-gray-400">We alert your sales team only when the buying signal is strong.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {/* Diagram */}
                    <div className="border border-white/10 rounded-xl bg-black p-8 relative z-10">
                        <div className="flex justify-between items-center mb-8">
                            <div className="space-y-1">
                                <div className="h-2 w-20 bg-gray-800 rounded" />
                                <div className="h-2 w-12 bg-gray-900 rounded" />
                            </div>
                            <div className="h-8 w-8 rounded bg-gray-900 border border-white/5" />
                        </div>

                        {/* Flow visualization */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded border border-white/5 bg-white/5">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                                    <span className="text-xs font-mono text-gray-400">Anonymous Visitor</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-600" />
                                <span className="text-xs font-mono text-white">Identify Company</span>
                            </div>

                            <div className="flex justify-center">
                                <div className="h-8 w-px bg-white/10" />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded border border-blue-500/20 bg-blue-500/5">
                                <div className="flex items-center space-x-3">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-mono text-blue-400">High Engagement</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-600" />
                                <span className="text-xs font-mono text-white">Score +25</span>
                            </div>

                            <div className="flex justify-center">
                                <div className="h-8 w-px bg-white/10" />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded border border-green-500/20 bg-green-500/5">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-mono text-green-400">Revenue Opportunity</span>
                                </div>
                                <span className="text-xs font-bold bg-green-500 text-black px-2 py-0.5 rounded">ALERT</span>
                            </div>
                        </div>
                    </div>

                    {/* Decorative back layer */}
                    <div className="absolute -inset-4 border border-white/5 rounded-2xl z-0 transform rotate-2" />
                </div>
            </div>
        </section>
    )
}

const Pricing = () => {
    return (
        <section id="pricing" className="py-32 bg-black border-t border-white/10 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-bold mb-6">Simple, transparent pricing.</h2>
                    <p className="text-xl text-gray-400">Start for free, scale as you grow.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Free Tier */}
                    <div className="border border-white/10 rounded-xl bg-[#050505] p-8 flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold">Unidentified</h3>
                            <div className="text-3xl font-bold mt-2">$0<span className="text-sm font-normal text-gray-400">/mo</span></div>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">For hobbyists and early stage startups.</p>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center text-sm text-gray-300"><Check className="w-4 h-4 mr-2 text-white" /> 1,000 Monthly Visitors</li>
                            <li className="flex items-center text-sm text-gray-300"><Check className="w-4 h-4 mr-2 text-white" /> Basic Intent Scoring</li>
                            <li className="flex items-center text-sm text-gray-300"><Check className="w-4 h-4 mr-2 text-white" /> 7-day Data Retention</li>
                        </ul>
                        <Link to="/register" className="w-full py-2 rounded border border-white/20 text-center text-sm font-semibold hover:bg-white/5 transition-colors">Start Free</Link>
                    </div>

                    {/* Pro Tier */}
                    <div className="border border-blue-500 rounded-xl bg-[#0A0A0A] p-8 flex flex-col relative shadow-[0_0_50px_rgba(0,112,243,0.1)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Most Popular
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white">Startup</h3>
                            <div className="text-3xl font-bold mt-2">$149<span className="text-sm font-normal text-gray-400">/mo</span></div>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">For growing teams engaging high-value leads.</p>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center text-sm text-white"><Check className="w-4 h-4 mr-2 text-blue-500" /> 50,000 Monthly Visitors</li>
                            <li className="flex items-center text-sm text-white"><Check className="w-4 h-4 mr-2 text-blue-500" /> Advanced Intent Patterns</li>
                            <li className="flex items-center text-sm text-white"><Check className="w-4 h-4 mr-2 text-blue-500" /> De-anonymization (IP to Company)</li>
                            <li className="flex items-center text-sm text-white"><Check className="w-4 h-4 mr-2 text-blue-500" /> 1-Year Data Retention</li>
                        </ul>
                        <Link to="/register" className="w-full py-2 rounded bg-white text-black text-center text-sm font-semibold hover:bg-gray-200 transition-colors">Get Started</Link>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="border border-white/10 rounded-xl bg-[#050505] p-8 flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold">Scale</h3>
                            <div className="text-3xl font-bold mt-2">Custom</div>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">For large organizations requiring SLA & security.</p>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center text-sm text-gray-300"><Check className="w-4 h-4 mr-2 text-white" /> Unlimited Visitors</li>
                            <li className="flex items-center text-sm text-gray-300"><Check className="w-4 h-4 mr-2 text-white" /> Dedicated Success Manager</li>
                            <li className="flex items-center text-sm text-gray-300"><Check className="w-4 h-4 mr-2 text-white" /> Slack & Teams Alerts</li>
                            <li className="flex items-center text-sm text-gray-300"><Check className="w-4 h-4 mr-2 text-white" /> Custom Contracts & SLA</li>
                        </ul>
                        <Link to="/contact" className="w-full py-2 rounded border border-white/20 text-center text-sm font-semibold hover:bg-white/5 transition-colors">Contact Sales</Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

const CTA = () => {
    return (
        <section className="py-32 border-t border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,112,243,0.1),transparent)] pointer-events-none" />
            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-5xl font-bold mb-8">Ready to deploy?</h2>
                <p className="text-gray-400 mb-10 text-lg">
                    Start identifying your high-intent traffic today. No credit card required.
                </p>
                <div className="flex justify-center space-x-4">
                    <Link
                        to="/register"
                        className="h-12 px-8 rounded bg-white text-black font-semibold flex items-center cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                        Start Free Trial
                    </Link>
                    <a href="#" className="h-12 px-8 rounded border border-white/20 text-white font-medium flex items-center hover:bg-white/5 transition-colors">
                        Read Documentation
                    </a>
                </div>
            </div>
        </section>
    )
}

const Footer = () => {
    return (
        <footer className="py-12 border-t border-white/10 bg-[#020202] text-sm">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-6 gap-8">
                <div className="col-span-2">
                    <div className="flex items-center space-x-2 font-bold mb-4">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-black translate-y-[0.5px]" />
                        </div>
                        <span>VisitorIntel</span>
                    </div>
                    <p className="text-gray-500 mb-4">
                        The intelligent revenue platform for modern B2B teams.
                    </p>
                    <div className="flex space-x-4 text-gray-500">
                        <a href="#" className="hover:text-white">Twitter</a>
                        <a href="#" className="hover:text-white">GitHub</a>
                        <a href="#" className="hover:text-white">LinkedIn</a>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Product</h4>
                    <ul className="space-y-2 text-gray-500">
                        <li><a href="#" className="hover:text-white">Features</a></li>
                        <li><a href="#" className="hover:text-white">Security</a></li>
                        <li><a href="#" className="hover:text-white">Enterprise</a></li>
                        <li><a href="#" className="hover:text-white">Changelog</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Resources</h4>
                    <ul className="space-y-2 text-gray-500">
                        <li><a href="#" className="hover:text-white">Documentation</a></li>
                        <li><a href="#" className="hover:text-white">API Reference</a></li>
                        <li><a href="#" className="hover:text-white">Guides</a></li>
                        <li><a href="#" className="hover:text-white">Support</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Company</h4>
                    <ul className="space-y-2 text-gray-500">
                        <li><Link to="/about" className="hover:text-white">About</Link></li>
                        <li><a href="#" className="hover:text-white">Blog</a></li>
                        <li><a href="#" className="hover:text-white">Careers</a></li>
                        <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Legal</h4>
                    <ul className="space-y-2 text-gray-500">
                        <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                        <li><a href="#" className="hover:text-white">DPA</a></li>
                    </ul>
                </div>
            </div>
        </footer>
    )
}

export default function LandingPage() {
    return (
        <div className="bg-black min-h-screen text-white font-sans selection:bg-blue-500/30 selection:text-white">
            <Navbar />
            <Hero />
            <Marquee />
            <Features />
            <MethodologyWaitlist />
            <Pricing />
            <CTA />
            <Footer />
        </div>
    )
}
