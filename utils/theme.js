export const getThemeColors = (isDark) => {
  if (isDark) {
    return {
      // Backgrounds
      bg: "#0a0e27",
      bgAlt: "#1a1f3a",
      bgLight: "rgba(10, 14, 39, 0.4)",
      bgOverlay: "rgba(10, 14, 39, 0.7)",
      
      // Text
      text: "#f0f5ff",
      textMuted: "#a0aec0",
      textDark: "#0a0e27",
      
      // Accents
      cyan: "#00d4ff",
      cyanBright: "#00f0ff",
      purple: "#a855f7",
      red: "#ff1744",
      yellow: "#ffd60a",
      
      // Borders
      border: "rgba(0, 212, 255, 0.3)",
      borderMuted: "rgba(148, 163, 184, 0.22)",
      
      // Button
      btnBg: "rgba(0, 212, 255, 0.1)",
      btnBorder: "2px solid rgba(0, 212, 255, 0.4)",
      btnColor: "#00d4ff",
      
      // Shadow
      shadowCyan: "0 0 16px rgba(0, 212, 255, 0.2)",
      shadowPurple: "0 0 16px rgba(168, 85, 247, 0.2)",
    };
  } else {
    return {
      // Backgrounds
      bg: "#f0f4f8",
      bgAlt: "#e8f1f6",
      bgLight: "rgba(230, 240, 250, 0.5)",
      bgOverlay: "rgba(240, 244, 248, 0.9)",
      
      // Text
      text: "#1a1f3a",
      textMuted: "#475569",
      textDark: "#1a1f3a",
      
      // Accents
      cyan: "#0284c7",
      cyanBright: "#0ea5e9",
      purple: "#7c3aed",
      red: "#dc2626",
      yellow: "#ca8a04",
      
      // Borders
      border: "rgba(2, 132, 199, 0.3)",
      borderMuted: "rgba(148, 163, 184, 0.3)",
      
      // Button
      btnBg: "rgba(100, 200, 255, 0.1)",
      btnBorder: "2px solid rgba(100, 180, 255, 0.6)",
      btnColor: "#1e40af",
      
      // Shadow
      shadowCyan: "0 0 16px rgba(2, 132, 199, 0.15)",
      shadowPurple: "0 0 16px rgba(124, 58, 237, 0.15)",
    };
  }
};

export const useTheme = () => {
  const theme =
    typeof window !== "undefined"
      ? localStorage.getItem("theme") || "dark"
      : "dark";
  return theme === "dark";
};
