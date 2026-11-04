/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        /* Brand palette — FruGrade Panduan Warna */
        'strawberry-red': '#F45155',
        'forest-green': '#2E5D3A',
        'peach-orange': '#FFA45B',
        'sunny-yellow': '#FFC943',
        'leaf-green': '#7BA65B',
        'warm-white': '#FFFDF8',
        'soft-charcoal': '#3D3835',
        'light-gray': '#F2F2F2',
        'placeholder-gray': '#D0D0D0',
        'border-gray': '#999999',

        /* Extended surfaces */
        surface: '#FBF9F4',
        'surface-dim': '#DBDAD5',
        'surface-variant': '#E4E2DE',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F5F3EE',
        'surface-container': '#EFEEE9',
        'surface-container-high': '#EAE8E3',
        'surface-container-highest': '#E4E2DE',
        background: '#FBF9F4',
        'on-background': '#1B1C19',
        'on-surface': '#1B1C19',
        'on-surface-variant': '#5A403F',
        'inverse-surface': '#30312E',
        'inverse-on-surface': '#F2F1EC',

        primary: '#B21F2C',
        'primary-container': '#D53A41',
        'on-primary': '#FFFFFF',
        'primary-fixed': '#FFDAD8',
        'primary-fixed-dim': '#FFB3B0',
        'on-primary-fixed': '#410006',
        'on-primary-fixed-variant': '#93001A',
        'inverse-primary': '#FFB3B0',
        'surface-tint': '#B6222E',

        secondary: '#396844',
        'secondary-container': '#B8ECBF',
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#3D6D48',
        'secondary-fixed': '#BBEFC1',
        'secondary-fixed-dim': '#9FD3A7',
        'on-secondary-fixed': '#00210B',
        'on-secondary-fixed-variant': '#21502E',

        tertiary: '#8E4A02',
        'tertiary-container': '#AD611E',
        'on-tertiary': '#FFFFFF',
        'on-tertiary-container': '#FFFBFF',
        'tertiary-fixed': '#FFDCC4',
        'tertiary-fixed-dim': '#FFB781',
        'on-tertiary-fixed': '#2F1400',
        'on-tertiary-fixed-variant': '#6F3800',

        error: '#BA1A1A',
        'on-error': '#FFFFFF',
        'error-container': '#FFDAD6',
        'on-error-container': '#93000A',

        outline: '#8E706E',
        'outline-variant': '#E2BEBC'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px'
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        'space-2xl': '3rem',
        gutter: '1.5rem',
        margin: '2rem'
      },
      fontFamily: {
        'headline-md': ['Poppins', 'system-ui', 'sans-serif'],
        'headline-sm': ['Poppins', 'system-ui', 'sans-serif'],
        'headline-lg': ['Poppins', 'system-ui', 'sans-serif'],
        'body-sm': ['Inter', 'system-ui', 'sans-serif'],
        'body-md': ['Inter', 'system-ui', 'sans-serif'],
        'body-lg': ['Inter', 'system-ui', 'sans-serif'],
        'label-sm': ['Inter', 'system-ui', 'sans-serif'],
        'label-md': ['Inter', 'system-ui', 'sans-serif'],
        'label-lg': ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-lg': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'label-md': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }]
      },
      boxShadow: {
        soft: '0 1px 2px rgba(61, 56, 53, 0.04), 0 8px 24px -12px rgba(61, 56, 53, 0.12)',
        card: '0 1px 2px rgba(61, 56, 53, 0.05), 0 18px 40px -22px rgba(61, 56, 53, 0.28)',
        lift: '0 2px 4px rgba(61, 56, 53, 0.06), 0 28px 60px -28px rgba(61, 56, 53, 0.34)'
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    }
  },
  plugins: []
};
