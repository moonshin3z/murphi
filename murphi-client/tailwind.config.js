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
        // Dark mode backgrounds
        dark: {
          bg: '#0D1117',
          surface: '#161B22',
          elevated: '#21262D',
          border: '#30363D',
          hover: '#292E36',
        },
        // Mint - Primary accent
        mint: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#3FB68B',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Ocean - Secondary accent
        ocean: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#79C0FF',
          500: '#58A6FF',
          600: '#3B82F6',
          700: '#2563EB',
          800: '#1D4ED8',
          900: '#1E40AF',
        },
        // Text colors for dark mode
        text: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          muted: '#484F58',
          inverse: '#0D1117',
        },
        // Semantic colors
        success: {
          DEFAULT: '#3FB68B',
          light: '#6EE7B7',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#D29922',
          light: '#F59E0B',
          dark: '#B45309',
        },
        danger: {
          DEFAULT: '#F85149',
          light: '#FCA5A5',
          dark: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.9375rem', { lineHeight: '1.5rem' }],
        'lg': ['1.0625rem', { lineHeight: '1.75rem' }],
        'xl': ['1.1875rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.4375rem', { lineHeight: '2rem' }],
        '3xl': ['1.8125rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.1875rem', { lineHeight: '2.5rem' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '580',
        bold: '650',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        'glow-mint': '0 0 20px rgba(63, 182, 139, 0.15)',
        'glow-mint-lg': '0 0 40px rgba(63, 182, 139, 0.2)',
        'glow-ocean': '0 0 20px rgba(88, 166, 255, 0.15)',
        'glow-danger': '0 0 20px rgba(248, 81, 73, 0.15)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.15), 0 4px 16px -4px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-mint': 'linear-gradient(135deg, #3FB68B 0%, #34D399 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #58A6FF 0%, #79C0FF 100%)',
        'gradient-danger': 'linear-gradient(135deg, #F85149 0%, #FCA5A5 100%)',
        'gradient-dark': 'linear-gradient(180deg, #161B22 0%, #0D1117 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(63, 182, 139, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(63, 182, 139, 0.25)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
