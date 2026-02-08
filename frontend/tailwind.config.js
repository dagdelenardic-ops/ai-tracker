/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a25',
          600: '#252535',
          500: '#333344',
        },
        brand: {
          openai: '#10A37F',
          anthropic: '#CC785C',
          google: '#4285F4',
          xai: '#FF6B6B',
          moonshot: '#6366F1',
          microsoft: '#00A4EF',
          perplexity: '#22C55E',
          meta: '#0081FB',
          mistral: '#FF4500',
          character: '#8B5CF6',
          poe: '#A855F7',
          huggingface: '#FFD21E',
          midjourney: '#1A1A2E',
          runway: '#FF3366',
          luma: '#3B82F6',
          suno: '#F59E0B',
          elevenlabs: '#10B981',
          cursor: '#000000',
          github: '#6E40C9',
          notion: '#F5F5F5',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
