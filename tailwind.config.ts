import type { Config } from "tailwindcss";

const config = {
    darkMode: ["class", "lemon"], // Enable class-based lemon theme
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    // plugins: [require("daisyui")],
    daisyui: {
        themes: [
            "light",
            "dark",
            {
                "capital-crew": {
                    "primary": "#0F172A", // Deep Navy Blue
                    "secondary": "#D4AF37", // Metallic Gold
                    "accent": "#38BDF8", // Cyan
                    "neutral": "#1e293b",
                    "base-100": "#ffffff",
                    "info": "#3abff8",
                    "success": "#36d399",
                    "warning": "#fbbd23",
                    "error": "#f87272",
                },
            },
        ],
    },
};
export default config;
