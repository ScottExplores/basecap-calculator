"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import clsx from "clsx";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-10 h-10" />; // Placeholder

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={clsx(
                "p-2.5 rounded-full transition-all duration-300 border shadow-lg hover:scale-105 active:scale-95",
                theme === 'dark'
                    ? "bg-slate-800 text-yellow-400 border-slate-700 hover:text-yellow-300" // Dark mode -> Show Sun (Yellow)
                    : "bg-white text-blue-600 border-slate-200 hover:text-blue-700 shadow-blue-500/10" // Light mode -> Show Moon (Blue)
            )}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}
