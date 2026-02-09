import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            {/* Nav */}
            <nav className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2 text-sm font-semibold hover:text-gray-300 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Link>
                    <div className="font-mono text-xs text-gray-500">LAST UPDATED: FEB 2026</div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-6">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Privacy Policy</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        We believe that privacy is a fundamental human right. Our architecture is designed to protect user anonymity by default.
                    </p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none">
                    <div className="grid md:grid-cols-2 gap-8 mb-16 not-prose">
                        <div className="p-6 rounded-xl border border-white/10 bg-[#050505]">
                            <Lock className="w-6 h-6 text-blue-500 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Zero PII Storage</h3>
                            <p className="text-sm text-gray-400">We do not store personally identifiable information unless explicitly provided by the user.</p>
                        </div>
                        <div className="p-6 rounded-xl border border-white/10 bg-[#050505]">
                            <Eye className="w-6 h-6 text-green-500 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Transparency</h3>
                            <p className="text-sm text-gray-400">Our code is open for audit. We engage third-party security firms for regular penetration testing.</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">1. Data Collection & Usage</h2>
                    <p className="text-gray-400 mb-4">
                        We collect minimal data necessary to provide our services. This includes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-400 mb-8">
                        <li><strong className="text-white">Usage Data:</strong> Pages visited, dwell time, and interactions.</li>
                        <li><strong className="text-white">Device Information:</strong> Browser type, OS, and IP address (processed at edge, then discarded).</li>
                        <li><strong className="text-white">Account Information:</strong> Email and billing details for customers.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">2. Data Processing Architecture</h2>
                    <p className="text-gray-400 mb-6">
                        Our unique "Edge-First" architecture processes IP addresses purely for geolocation and company identification.
                        The raw IP remains in volatile memory and is never written to disk.
                    </p>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg font-mono text-xs text-gray-400 mb-8">
                        Process: Request &rarr; Edge Node &rarr; IP Lookup &rarr; Company ID &rarr; Discard IP &rarr; Analytics DB
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">3. Third-Party Sharing</h2>
                    <p className="text-gray-400 mb-6">
                        We do not sell data to third parties. We share data only with sub-processors required to run our infrastructure (e.g., AWS, Stripe).
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">4. Your Rights (GDPR & CCPA)</h2>
                    <p className="text-gray-400 mb-6">
                        You have the right to access, correct, or delete your data at any time.
                    </p>
                    <div className="flex gap-4">
                        <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded hover:bg-gray-200 transition-colors">Request Data Export</button>
                        <button className="px-4 py-2 border border-white/20 text-white text-sm font-bold rounded hover:bg-white/5 transition-colors">Delete My Data</button>
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">5. Contact Us</h2>
                    <p className="text-gray-400">
                        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@visitorintel.com" className="text-blue-500 hover:text-blue-400 underline">privacy@visitorintel.com</a>.
                    </p>
                </div>
            </div>

            <footer className="border-t border-white/10 py-12 bg-[#050505] text-center">
                <p className="text-gray-500 text-sm">© 2026 Visitor Intel Inc. All rights reserved.</p>
            </footer>
        </div>
    )
}
