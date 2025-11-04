export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        ui: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Meiryo', 'sans-serif'],
        gothic: ['Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', 'sans-serif'],
        mincho: ['Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', 'serif'],
        manga: ['Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', 'serif']
      }
    }
  },
  plugins: []
}
