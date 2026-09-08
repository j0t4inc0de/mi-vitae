import { rawPalette, semanticTokens } from './src/theme/palette.js'

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
        // Escalas completas de la paleta activa recibida (50 a 950)
        // Permite usar: bg-almond-cream-500, text-prussian-blue-600, etc.
        ...rawPalette,

        // Tokens semánticos globales
        primary: semanticTokens.primary,
        accent: semanticTokens.accent,
        highlight: semanticTokens.highlight,
        'palette-primary': semanticTokens.primary.DEFAULT,
        'palette-hover': semanticTokens.primary.hover,
        'palette-accent': semanticTokens.accent.DEFAULT,
        'palette-highlight': semanticTokens.highlight.DEFAULT,
        brand: {
          50: semanticTokens.primary.light,
          500: semanticTokens.primary.DEFAULT,
          600: semanticTokens.primary.hover,
          700: semanticTokens.accent.DEFAULT,
        },

        // Temas de portafolios de usuarios
        theme: {
          minimalist: {
            bg: '#FAFAF9',
            card: '#FFFFFF',
            text: '#1C1917',
            accent: '#44403C',
            border: '#E7E5E4'
          },
          creative: {
            bg: '#0F0E17',
            card: '#1B1A28',
            text: '#FFFFFE',
            accent: '#8B5CF6',
            highlight: '#EC4899',
            border: '#2E2D44'
          },
          tech: {
            bg: '#0A0E17',
            card: '#111827',
            text: '#F3F4F6',
            accent: '#10B981',
            highlight: '#06B6D4',
            border: '#1F2937'
          },
          warm: {
            bg: '#FDF8F5',
            card: '#FFFFFF',
            text: '#43281C',
            accent: '#D97706',
            border: '#F3E8E2'
          },
          executive: {
            bg: '#0B132B',
            card: '#1C2541',
            text: '#F8FAFC',
            accent: '#3A86FF',
            border: '#334155'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.2s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [
    function({ addBase }) {
      addBase({
        ':root': {
          '--primary': semanticTokens.primary.DEFAULT,
          '--primary-rgb': semanticTokens.primaryRgb || '79, 70, 229',
          '--primary-hover': semanticTokens.primary.hover,
          '--accent': semanticTokens.accent.DEFAULT,
          '--accent-rgb': semanticTokens.accentRgb || '6, 182, 212',
          '--highlight': semanticTokens.highlight.DEFAULT,
          '--gradient-from': semanticTokens.gradientFrom,
          '--gradient-via': semanticTokens.gradientVia,
          '--gradient-to': semanticTokens.gradientTo,
          '--glow': semanticTokens.glow,
        }
      })
    }
  ],
}
