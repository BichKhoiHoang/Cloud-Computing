/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/components/*.ejs",
    "./views/*.ejs",
    "./views/partials/*.ejs",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
