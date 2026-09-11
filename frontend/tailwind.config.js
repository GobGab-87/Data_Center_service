/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hp: {
          primary: '#024ad8',          // HP Electric Blue
          'primary-bright': '#296ef9',
          'primary-deep': '#0e3191',
          'primary-soft': '#c9e0fc',
          ink: '#1a1a1a',              // Near-black ink
          'ink-deep': '#000000',
          'ink-soft': '#292929',
          canvas: '#ffffff',           // Pure white
          paper: '#ffffff',
          cloud: '#f7f7f7',            // Alternating section band
          fog: '#e8e8e8',              // Utility / outer panel
          steel: '#c2c2c2',            // Hairline strong
          hairline: '#e8e8e8',         // Hairline border
          charcoal: '#3d3d3d',         // Muted body
          graphite: '#636363',         // Small-print / metadata
          coral: '#ff5050',            // Sale / highlight
          wine: '#5a1313',
          'bloom-deep': '#b3262b',     // Error / defect
          storm: '#356373',            // Neutral status / cooling
          'storm-mist': '#8ebdce',
          'storm-sea': '#7fadbe',
        },
        dc: {
          900: '#0b1329',
          800: '#111e38',
          700: '#1b2c52',
          600: '#263d6e',
          blue: '#024ad8',
          accent: '#024ad8',
          warn: '#ff5050',
          danger: '#b3262b',
          success: '#10b981'
        }
      },
      borderRadius: {
        'hp-none': '0px',
        'hp-xs': '2px',
        'hp-sm': '3px',
        'hp-md': '4px',                // Buttons & inputs (sharp 4px)
        'hp-lg': '8px',                // Badges, icon tiles
        'hp-xl': '16px',               // Cards & containers (soft 16px)
      },
      boxShadow: {
        'hp-soft': '0 2px 8px rgba(26, 26, 26, 0.08)',
        'hp-modal': '0 8px 24px rgba(26, 26, 26, 0.12)',
        '2xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      letterSpacing: {
        'hp-btn': '0.7px',
      }
    },
  },
  plugins: [],
}
