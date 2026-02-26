import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PricingSection } from '@/components/PricingSection'

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b bg-black/50 backdrop-blur-xl border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-black translate-y-[1px]" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">VisitorIntel</span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    {[{ label: 'Features', href: '/#features' }, { label: 'Analytics', href: '/#analytics' }, { label: 'Map', href: '/#map' }, { label: 'Methodology', href: '/#methodology' }, { label: 'Pricing', href: '/pricing' }].map((item) => (
                        <a key={item.label} href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                            {item.label}
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

const Footer = () => {
    return (
        <footer className="py-12 bg-[#020202] text-sm relative">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-6 gap-8">
                <div className="col-span-2">
                    <div className="flex items-center space-x-2 font-bold mb-4">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-black translate-y-[0.5px]" />
                        </div>
                        <span className="text-white">VisitorIntel</span>
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
                        <li><a href="/#features" className="hover:text-white">Features</a></li>
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

            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/20 overflow-hidden z-20">
                <motion.div
                    className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-100"
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
                <div className="absolute inset-0 bg-white/10" />
            </div>
        </footer>
    )
}

export default function PricingPage() {
    return (
        <div className="bg-black min-h-screen text-white font-sans selection:bg-blue-500/30 selection:text-white">
            <Navbar />
            <div className="pt-20">
                <PricingSection />
            </div>
            <Footer />
        </div>
    )
}
