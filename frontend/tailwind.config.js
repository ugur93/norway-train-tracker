/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#135bec",
                "primary-dark": "#0f4bc4",
                "background-light": "#f6f6f8",
                "background-dark": "#101622",
                "surface-dark": "#1c2333",
                "success": "#0bda5e",
                "warning": "#ff9f0a",
                "danger": "#ff453a",
            },
            fontFamily: {
                "display": ["Public Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
    corePlugins: {
        preflight: true,
    },
}