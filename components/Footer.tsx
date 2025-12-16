import { Github, Twitter, ExternalLink } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full py-8 text-slate-500 dark:text-slate-500 text-sm flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800/50 mt-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-6 rounded-t-2xl z-0">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Base Market Cap App</span>
                <span>&copy; {new Date().getFullYear()}</span>
            </div>

            <div className="flex items-center gap-6">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    <span>Twitter</span>
                </a>
                <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Built on Base</span>
                </a>
            </div>
        </footer>
    );
}
