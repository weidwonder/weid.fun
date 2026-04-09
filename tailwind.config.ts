import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
        'fluid-2xl': 'clamp(2rem, 1.7rem + 1.5vw, 3rem)',
        'fluid-3xl': 'clamp(2.5rem, 2rem + 2.5vw, 4.5rem)',
        'fluid-4xl': 'clamp(3rem, 2.25rem + 3.75vw, 6rem)',
      },
    },
  },
  plugins: [],
}

export default config
