/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Используем CSS переменные в формате rgb(r g b / alpha)
        // Это позволяет писать bg-primary/50 (полупрозрачность)
        background: 'rgb(var(--bg-main) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        panel: 'rgb(var(--bg-panel) / <alpha-value>)',

        // Текст
        foreground: 'rgb(var(--txt-main) / <alpha-value>)',
        muted: 'rgb(var(--txt-muted) / <alpha-value>)',

        // Акцентные цвета
        primary: 'rgb(var(--col-primary) / <alpha-value>)',
        'primary-fg': 'rgb(var(--col-primary-fg) / <alpha-value>)',

        danger: 'rgb(var(--col-danger) / <alpha-value>)',
        success: 'rgb(var(--col-success) / <alpha-value>)',
        warning: 'rgb(var(--col-warning) / <alpha-value>)',

        // Границы
        border: 'rgb(var(--col-border) / <alpha-value>)',
        input: 'rgb(var(--col-input) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        DEFAULT: 'var(--border-width)',
      },
      boxShadow: {
        'neo': 'var(--shadow-neo)',
        'inset': 'var(--shadow-inset)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
};