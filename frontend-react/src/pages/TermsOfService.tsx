import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react'

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            {/* Nav */}
            <nav className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2 text-sm font-semibold hover:text-gray-300 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Link>
                    <div className="font-mono text-xs text-gray-500">VERSION 2.1 (FEB 2026)</div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-6">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Terms of Service</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        By accessing Visitor Intel, you agree to abide by these terms. We aim to keep them fair and transparent.
                    </p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-gray-400">
                    <div className="not-prose mb-12 p-6 rounded-xl border border-blue-500/20 bg-blue-500/5">
                        <h3 className="text-blue-400 font-bold mb-2">Summary for Humans</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-blue-500 mt-0.5" /> You own your data. We process it on your behalf.</li>
                            <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-blue-500 mt-0.5" /> We offer a 99.9% uptime SLA for Enterprise plans.</li>
                            <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-blue-500 mt-0.5" /> You must not use our service for illegal surveillance or tracking.</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">1. Agreement to Terms</h2>
                    <p className="mb-6">
                        These Terms of Service ("Terms") constitute a legally binding agreement between you and Visitor Intel Inc. concerning your access to and use of the Visitor Intel platform.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">2. Use of Service</h2>
                    <p className="mb-6">
                        You are granted a limited, non-exclusive, non-transferable license to use the Service dependent on your subscription tier.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>You agree not to reverse engineer the underlying algorithms.</li>
                        <li>You agree not to use the service to build a competitive product.</li>
                        <li>You agree to comply with all applicable data protection laws (GDPR, CCPA).</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">3. Accounts & Security</h2>
                    <p className="mb-6">
                        You are responsible for maintaining the confidentiality of your account credentials. We offer Two-Factor Authentication (2FA) and strongly recommend enabling it.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">4. Payment & Billing</h2>
                    <p className="mb-6">
                        Services are billed on a subscription basis (monthly or annually). Payments are non-refundable except as required by law or our 30-day money-back guarantee for new accounts.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">5. Termination</h2>
                    <p className="mb-6">
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">6. Limitation of Liability</h2>
                    <p className="mb-6">
                        In no event shall Visitor Intel, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-6">7. Contact Information</h2>
                    <p>
                        Questions about the Terms of Service should be sent to us at <a href="mailto:legal@visitorintel.com" className="text-blue-500 hover:text-blue-400 underline">legal@visitorintel.com</a>.
                    </p>
                </div>
            </div>

            <footer className="border-t border-white/10 py-12 bg-[#050505] text-center">
                <p className="text-gray-500 text-sm">© 2026 Visitor Intel Inc. All rights reserved.</p>
            </footer>
        </div>
    )
}
