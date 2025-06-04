/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['var(--font-sans)'],
        grotesk: ['var(--font-grotesk)'],
        display: ['var(--font-display)'],
      },

      animation: {
        "scale-up-right":
          "scale-up-right 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000)   both",
        "scale-up-tr":
          "scale-up-tr 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000)   both",
      },

      keyframes: {
        "scale-up-right": {
          "0%": {
            transform: "scale(.5)",
            "transform-origin": "100% 50%",
          },
          to: {
            transform: "scale(1)",
            "transform-origin": "100% 50%",
          },
        },

        "scale-up-tr": {
          "0%": {
            transform: "scale(.5)",
            "transform-origin": "100% 0%",
          },
          to: {
            transform: "scale(1)",
            "transform-origin": "100% 0%",
          },
        },
      },
      
      colors: {
        primary: "#5115B3",
        primarydark: "#1f0150",
        secondary:  "#2356D3",
      }
    },
  },
  plugins: [],
}
