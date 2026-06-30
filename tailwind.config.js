/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          orange: '#4F46E5',
          'dark-blue': '#232F3E',
          'light-blue': '#146EB4',
          'squid-ink': '#16191F',
          'gray': {
            50: '#FAFAFA',
            100: '#F2F3F3',
            200: '#EAEDED',
            300: '#D5DBDB',
            400: '#AAB7B8',
            500: '#879596',
            600: '#687078',
            700: '#414750',
            800: '#2E3338',
            900: '#16191F',
          }
        }
      },
      fontFamily: {
        sans: ['Amazon Ember', 'Helvetica Neue', 'Roboto', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'aws': '0 1px 1px 0 rgba(0,28,36,0.3), 1px 1px 1px 0 rgba(0,28,36,0.15), -1px 1px 1px 0 rgba(0,28,36,0.15)',
        'aws-lg': '0 4px 20px 1px rgba(0,28,36,0.1)',
      }
    },
  },
  plugins: [],
}
