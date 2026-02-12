/** @type {import('tailwindcss').Config} */
module.exports = {
    // Use a more robust glob pattern
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./screens/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: "#A5D6A7",
                secondary: "#D1C4E9",
                accent: "#FFCC80",
                "manna-yellow": "#FFE082",
                "manna-brown": "#8D6E63",
                "primary-dark": "#689F38",
                "coral-pink-start": "#FF8A80",
                "coral-pink-end": "#FF5252",
                "mission-pink": "#FFF0F3",
                "interpretation-mint": "#E0F2F1",
            },
            fontFamily: {
                sans: ["NanumGothic_400Regular"],
                chunky: ["Jua_400Regular"],
                verse: ["GowunDodum_400Regular"],
            },
        },
    },
    plugins: [],
}
