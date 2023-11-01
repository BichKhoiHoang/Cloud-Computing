/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./components/*.ejs", "./views/*.ejs", "./partials/*.ejs"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
