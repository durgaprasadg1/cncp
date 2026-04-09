"use client";

import { useEffect, useState } from "react";

export default function SlidingWindowLayout({ children }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  // Listen for theme changes from homepage
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail?.theme || localStorage.getItem("theme") || "dark";
      setTheme(newTheme);
    };

    window.addEventListener("themechange", handleThemeChange);
    
    // Check for theme changes from other tabs
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem("theme") || "dark";
      setTheme(newTheme);
    };
    
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isDark = theme === "dark";
  const bgGradient = isDark
    ? "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)"
    : "linear-gradient(135deg, #f0f4f8 0%, #e8f1f6 100%)";
  const textColor = isDark ? "#f0f5ff" : "#1a1f3a";

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: bgGradient,
          padding: "30px 20px",
          color: textColor,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bgGradient,
        padding: "30px 20px",
        color: textColor,
        position: "relative",
      }}
    >
      {/* Centered Content */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}
