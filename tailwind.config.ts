import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#0A0A0A",
        surface: {
          DEFAULT: "#141417",
          2: "#1C1C1F",
        },
        line: "rgba(255,255,255,0.08)",
        white: "#FAFAFA",
        muted: "#A1A1AA",
        red: {
          500: "#E2231A",
          600: "#FF2D20",
        },
        re: {
          cream: "#F5EDD8",
          gold: "#C9A84C",
          red: "#C8102E",
          dark: "#1A1208",
        },
        sz: {
          blue: "#003DA5",
          red: "#E40521",
          silver: "#C0C0C0",
          night: "#00051A",
        },
        wsp: "#25D366",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
        "24": "96px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-soft": "cubic-bezier(0.45, 0, 0.55, 1)",
      },
      zIndex: {
        "1": "1",
        "10": "10",
        "20": "20",
        "40": "40",
        "50": "50",
        "100": "100",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        bounceDown: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.6" },
          "50%": { transform: "translateY(8px)", opacity: "1" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-8px)" },
          "40%": { transform: "translateX(8px)" },
          "60%": { transform: "translateX(-5px)" },
          "80%": { transform: "translateX(5px)" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        bounceDown: "bounceDown 1.6s ease-in-out infinite",
        pulseRing: "pulseRing 2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        shake: "shake 400ms ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
