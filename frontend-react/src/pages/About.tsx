import { ArrowLeft, Target, Rocket, Heart, Mail, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutPage() {
    const stats = [
        { label: 'Active Users', value: '1,000+' },
        { label: 'Websites Tracked', value: '2,500+' },
        { label: 'Events Processed', value: '50M+' },
        { label: 'Insights Generated', value: '100K+' },
    ]

    const features = [
        {
            title: 'Real-time Intelligence',
            description: 'See exactly who is on your site right now, where they are from, and what they are doing.',
            icon: Target,
            color: 'bg-purple-500/10 text-purple-400',
        },
        {
            title: 'AI-Powered Insights',
            description: 'Our proprietary ML algorithms identify buying intent and surface high-probability accounts.',
            icon: Rocket,
            color: 'bg-blue-500/10 text-blue-400',
        },
        {
            title: 'Privacy First',
            description: 'Fully compliant with GDPR, CCPA, and DPDP. No cookies, no fingerprinting, total transparency.',
            icon: Shield,
            color: 'bg-green-500/10 text-green-400',
        },
        {
            title: 'Human Centered',
            description: 'Built by marketers and engineers who care about building better customer experiences.',
            icon: Heart,
            color: 'bg-pink-500/10 text-pink-400',
        },
    ]

    return (
        <div className="min-h-screen bg-[#030014] overflow-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        <span className="text-gray-400 group-hover:text-white transition-colors font-medium">Back to Home</span>
                    </Link>
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white">
                            V
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Visitor Intel
                        </span>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 pb-40">
                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-32">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/40 leading-tight">
                        We help you see the invisible.
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        Visitor Intel was born out of a simple problem: businesses knew people were visiting their sites, but They had no idea who they were or what they wanted.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
                    {stats.map((stat, index) => (
                        <div key={index} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm text-center">
                                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest font-semibold">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Vision Header */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-8">Our Mission & Vision</h2>
                        <div className="space-y-6">
                            <p className="text-lg text-gray-400">
                                Our mission is to democratize B2B intelligence. We believe that every company, regardless of size, should have access to the same visitor insights as Fortune 500 enterprises.
                            </p>
                            <p className="text-lg text-gray-400">
                                We're building the first privacy-native identity platform for the post-cookie web. By focusing on account-level intelligence rather than individual stalking, we help businesses sell more while respecting user privacy.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {features.map((feature, index) => (
                            <div key={index} className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                                <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center mb-4`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-[40px] blur-3xl" />
                    <div className="relative p-12 md:p-20 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-xl text-center overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <Mail className="w-64 h-64 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-6">Want to learn more?</h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                            Our team is always happy to chat about B2B intelligence, buyer intent, or how we can help your business grow.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <a
                                href="mailto:contact@visitorintel.com"
                                className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all w-full sm:w-auto"
                            >
                                Contact Sales
                            </a>
                            <Link
                                to="/register"
                                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all border border-white/10 w-full sm:w-auto"
                            >
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-gray-500">© 2024 Visitor Intel. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
