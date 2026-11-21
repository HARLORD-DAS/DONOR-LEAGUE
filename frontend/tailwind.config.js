/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#155EEF",     // Primary blue
          secondary: "#2878E5",   // Secondary blue
          navy: "#14213D",        // Dark navy
          bg: "#F5F8FF",          // Background light
          light: "#EAF2FF",       // Light blue
          border: "#E2E8F0",      // Border gray
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(20, 33, 61, 0.06), 0 2px 6px -1px rgba(20, 33, 61, 0.04)',
        'elevated': '0 12px 32px -4px rgba(21, 94, 239, 0.12), 0 4px 12px -2px rgba(20, 33, 61, 0.06)',
        '3d': '0 10px 25px -5px rgba(21, 94, 239, 0.25), 0 8px 10px -6px rgba(21, 94, 239, 0.2)',
      }
    },
  },
  plugins: [],
}
