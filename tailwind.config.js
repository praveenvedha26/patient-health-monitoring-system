/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      width: {
        '128': '800px',
        "80":"141px"
        
      },
      lineHeight: {
        'extra-loose': '2.5',
        '12': '3rem',
      },
      margin:{
         '400px':'400px'

      },
      height:{
        '128':'800px'
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors:{
         "blue-slate": "#F3F9FF",
          "blue-button":"#1B88F4",
          

      },
      gap:{
        "10":"200px"
      },
      
    },
  },
  plugins: [],
}