import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
    "./scripts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: "#1B2A4A",
        "brand-blue": "#2563EB",
        teal: "#0D9488",
      },
      keyframes: {
        "cascade-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(220, 38, 38, 0.00)" },
        },
      },
      animation: {
        "cascade-pulse": "cascade-pulse 1.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
