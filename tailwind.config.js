/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                orbitron: ['Orbitron', 'sans-serif'],
            },
            colors: {
                'sz-red': '#E31E24',
                'sz-red-dark': '#b91217',
                'dark-bg': '#050505',
                'light-bg': '#f3f4f6',
                'card-bg': '#0f0f0f',
                'card-light': '#ffffff',
                'panel-border': '#2a2a2a',
            },
            backgroundImage: {
                'hero-gradient': 'linear-gradient(to bottom, #080808, #1a0505)',
                'red-glow': 'radial-gradient(circle, rgba(227, 30, 36, 0.15) 0%, rgba(8,8,8,0) 70%)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'marquee': 'marquee 120s linear infinite',
                'typewriter': 'typewriter 2s steps(40) 1s 1 normal both',
                'blinkTextCursor': 'blinkTextCursor 500ms steps(40) infinite normal',
                'strike': 'strike 0.5s ease-in-out forwards',
                'glitch': 'glitch 1s linear infinite',
                'circuit-flow': 'circuitFlow 20s linear infinite',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                typewriter: {
                    'from': { width: '0' },
                    'to': { width: '100%' },
                },
                blinkTextCursor: {
                    'from': { borderRightColor: 'rgba(227, 30, 36, 0.75)' },
                    'to': { borderRightColor: 'transparent' },
                },
                strike: {
                    '0%': { width: '0', opacity: '1' },
                    '100%': { width: '100%', opacity: '0.6' },
                },
                glitch: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-2px)' },
                    '75%': { transform: 'translateX(2px)' },
                },
                circuitFlow: {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '100% 100%' },
                },
            },
        },
    },
    plugins: [],
}
