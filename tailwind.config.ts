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
                    "primary": "#0F172A", // Deep Navy (Sidebar)
                    "secondary": "#00C2E0", // Electric Cyan (Accent)
                    "accent": "#10B981", // Emerald (Growth)
                    "neutral": "#1E293B",
                    "base-100": "#FFFFFF", // Content Surface
                    "base-200": "#F3F4F6", // Page Background (Subtle Smoke)
                    "info": "#3B82F6",
                    "success": "#10B981",
                    "warning": "#F59E0B",
                    "error": "#EF4444",
                },
            },
        ],
    },
};
export default config;
