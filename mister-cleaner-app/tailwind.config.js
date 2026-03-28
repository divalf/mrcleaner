/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA',
        primary: '#F7A693',
        accent: '#fa6632',
        dark: '#1A1A1A',
        surface: '#FFFFFF',
      },
      fontFamily: {
        heading: ['"Work Sans"', 'sans-serif'],
        drama: ['"Playfair Display"', 'serif'],
        data: ['"IBM Plex Mono"', 'monospace'],
        body: ['"Roboto"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
