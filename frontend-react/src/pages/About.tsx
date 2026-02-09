import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Target, Rocket, Heart, Mail, Shield } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            {/* Nav */}
            <nav className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2 text-sm font-semibold hover:text-gray-300 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Link>
                    <div className="flex items-center space-x-6 text-sm">
                        <a href="#mission" className="text-gray-400 hover:text-white transition-colors">Mission</a>
                        <a href="#team" className="text-gray-400 hover:text-white transition-colors">Team</a>
                        <a href="#contact" className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors">Contact</a>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <header className="py-32 border-b border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-small [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-20 pointer-events-none" />
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                        Democratizing<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Visitor Intelligence</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        We are a team of engineers, data scientists, and designers building the future of B2B intent data. We believe powerful analytics shouldn't require a privacy compromise.
                    </p>
                </div>
            </header>

            {/* Values Grid */}
            <section id="mission" className="py-32 bg-[#050505] border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
                        <p className="text-gray-400">The principles that guide our product and culture.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="p-8 border border-white/10 rounded-xl bg-black">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 text-blue-500">
                                <Target className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Precision</h3>
                            <p className="text-sm text-gray-400">We obsess over data accuracy. If it's not verified, it's not in our database.</p>
                        </div>
                        <div className="p-8 border border-white/10 rounded-xl bg-black">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 text-purple-500">
                                <Rocket className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Velocity</h3>
                            <p className="text-sm text-gray-400">We ship fast. Our customers move quickly, and so do we.</p>
                        </div>
                        <div className="p-8 border border-white/10 rounded-xl bg-black">
                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-6 text-green-500">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Privacy</h3>
                            <p className="text-sm text-gray-400">Privacy is not a feature; it's the foundation. We don't track without consent.</p>
                        </div>
                        <div className="p-8 border border-white/10 rounded-xl bg-black">
                            <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center mb-6 text-pink-500">
                                <Heart className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Empathy</h3>
                            <p className="text-sm text-gray-400">We build for humans. We solve real problems for real teams.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section id="team" className="py-32 bg-black border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16 flex items-end justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Meet the Team</h2>
                            <p className="text-gray-400">The builders behind the platform.</p>
                        </div>
                        <a href="#" className="hidden md:block text-blue-500 hover:text-blue-400 text-sm font-bold">Join us &rarr;</a>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="group">
                                <div className="aspect-square bg-[#111] rounded-xl border border-white/10 mb-4 overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                            {/* Placeholder for real images */}
                                        </div>
                                    </div>
                                    {/* Abstract placeholder */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-mono text-xs">
                                        [PHOTO_PLACEHOLDER_{i}]
                                    </div>
                                </div>
                                <h3 className="font-bold text-white">Team Member {i}</h3>
                                <p className="text-sm text-gray-500">Co-Founder & Role</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section id="contact" className="py-32 bg-[#050505]">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-8">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
                    <p className="text-xl text-gray-400 mb-12">
                        Have questions about enterprise plans, security, or integrations? Our team is ready to help.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
                        <a href="mailto:sales@visitorintel.com" className="p-4 rounded-lg border border-white/10 bg-black hover:border-blue-500 transition-colors text-left group">
                            <h4 className="font-bold text-white group-hover:text-blue-500 transition-colors">Sales Inquiry</h4>
                            <p className="text-sm text-gray-500 mt-1">For Enterprise plans & demos</p>
                            <div className="mt-4 text-xs font-mono text-gray-600">sales@visitorintel.com</div>
                        </a>
                        <a href="mailto:support@visitorintel.com" className="p-4 rounded-lg border border-white/10 bg-black hover:border-white/30 transition-colors text-left group">
                            <h4 className="font-bold text-white">Product Support</h4>
                            <p className="text-sm text-gray-500 mt-1">For technical issues & help</p>
                            <div className="mt-4 text-xs font-mono text-gray-600">support@visitorintel.com</div>
                        </a>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/10 py-12 bg-black text-center">
                <p className="text-gray-500 text-sm">© 2026 Visitor Intel Inc. All rights reserved.</p>
            </footer>
        </div>
    )
}
