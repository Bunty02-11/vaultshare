export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: {
          bg: "var(--bg)",
          sidebar: "var(--sidebar)",
          card: "var(--card)",
          primary: "var(--primary)",
          "on-primary": "var(--on-primary)",
          accent: "var(--accent)",
          "on-accent": "var(--on-accent)",
          border: "var(--border)",
          text: "var(--text)",
          muted: "var(--text-muted)",
          navbar: "var(--navbar)",
          input: "var(--input-bg)",
          hover: "var(--hover)",
        },
      },
    },
  },
  plugins: [],
};
