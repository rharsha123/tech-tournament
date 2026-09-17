// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        snb: {
          green: "#005A36",       // Primary SNB Emerald Green
          dark: "#003D23",        // Dark Header & Container Green
          accent: "#C5A059",      // SNB Warm Gold Accent
          goldLight: "#E5C158",   // Highlight Gold
          bg: "#F4F7F5",          // Off-white sports canvas background
        }
      }
    },
  },
  plugins: [],
}
