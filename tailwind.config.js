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
  corePlugins: {
    aspectRatio: false,
  },
  plugins: [require("daisyui"), require("@tailwindcss/aspect-ratio")],
};
