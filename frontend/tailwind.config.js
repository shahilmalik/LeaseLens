/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bcd1ff",
          300: "#8eb2ff",
          400: "#5d8aff",
          500: "#3b66ff",
          600: "#2546f0",
          700: "#1d36cc",
          800: "#1c2ea3",
          900: "#1c2b80",
          DEFAULT: "#2546f0",
          dark: "#1d36cc"
        },
        ink: {
          50: "#f7f8fb",
          100: "#eef0f6",
          200: "#dde1ec",
          300: "#bac1d3",
          400: "#8b94ad",
          500: "#5f6982",
          600: "#404a63",
          700: "#2c3447",
          800: "#1a1f2e",
          900: "#0c1019"
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f6f8fc",
          subtle: "#fbfcfe"
        },
        success: { 50:"#ecfdf5",100:"#d1fae5",500:"#10b981",600:"#059669",700:"#047857" },
        warning: { 50:"#fffbeb",100:"#fef3c7",500:"#f59e0b",600:"#d97706",700:"#b45309" },
        danger:  { 50:"#fef2f2",100:"#fee2e2",500:"#ef4444",600:"#dc2626",700:"#b91c1c" }
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)",
        pop: "0 10px 30px -10px rgba(37,70,240,0.35)",
        ring: "0 0 0 4px rgba(37,70,240,0.12)"
      },
      keyframes: {
        "fade-in":   { "0%": { opacity: 0, transform: "translateY(4px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "scale-in":  { "0%": { opacity: 0, transform: "scale(0.96)" },     "100%": { opacity: 1, transform: "scale(1)" } },
        shimmer:     { "0%": { backgroundPosition: "-400px 0" },            "100%": { backgroundPosition: "400px 0" } }
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "scale-in": "scale-in 0.25s ease-out both",
        shimmer: "shimmer 1.4s linear infinite"
      }
    }
  },
  plugins: []
};
