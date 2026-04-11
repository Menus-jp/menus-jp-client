import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        "primary-dark": "#15803D",
        "primary-light": "#16A34A",
        "primary-lighter": "#22C55E",
        
        // Accent Colors
        "accent-gold": "#F59E0B",
        "accent-yellow": "#FBBF24",
        
        // Text Colors
        "text-dark": "#111111",
        "text-secondary": "#6B7280",
        "text-tertiary": "#9CA3AF",
        
        // Background & Border
        "bg-light": "#F9FAFB",
        "bg-lighter": "#F3F4F6",
        "border-color": "#E5E7EB",
        
        // Utility Colors
        "blue-primary": "#2563EB",
        "blue-secondary": "#3B82F6",
        "red-error": "#EF4444",
        "red-dark": "#DC2626",
        
        // Greens
        "green-dark-1": "#15803D",
        "green-dark-2": "#166534",
        "green-dark-3": "#22C55E",
      },
    },
  },
  plugins: [],
};

export default config;
