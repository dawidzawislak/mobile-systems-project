/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }], // was 2xs
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // was xs
        base: ["1rem", { lineHeight: "1.5rem" }], // was sm
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // was base
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // was lg
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // was xl
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // was 2xl
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // was 3xl
        "5xl": ["3rem", { lineHeight: "1" }], // was 4xl
        "6xl": ["3.75rem", { lineHeight: "1" }], // was 5xl
        "7xl": ["4.5rem", { lineHeight: "1" }], // was 6xl
        "8xl": ["6rem", { lineHeight: "1" }], // was 7xl
        "9xl": ["8rem", { lineHeight: "1" }], // was 8xl
      },
    },
  },
  plugins: [],
};
