/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // 前端專案所有 template/tsx 檔案
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",

    // 如果有放到外層 monorepo，例如 shared component
    // "../shared/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
