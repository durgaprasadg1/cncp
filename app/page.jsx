"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getThemeColors } from "@/utils/theme";

const ACK_TYPES = [
  {
    title: "Positive Acknowledgement",
    description:
      "The acknowledgement sent by the receiver on receiving a frame successfully is known as positive acknowledgement.",
  },
  {
    title: "Negative Acknowledgement",
    description:
      "When the frame is lost during transmission and the receiver sends an acknowledgement for the retransmission of the lost frame is known as negative acknowledgement.",
  },
  {
    title: "Lost Acknowledgement",
    description:
      "The frame is successfully received by the receiver, but the acknowledgement sent by the receiver to the sender is lost during transmission, known as lost acknowledgement.",
  },
  {
    title: "Independent Acknowledgement",
    description:
      "The sender sends frames one by one, and the receiver is sending an acknowledgement of each received frame, this is known as independent acknowledgement.",
  },
  {
    title: "Cumulative Acknowledgement",
    description:
      "The sender sends a set of frames to the receiver, and the receiver sends an acknowledgement for the next set of frames is known as cumulative acknowledgement.",
  },
  {
    title: "Delayed Acknowledgement",
    description:
      "When the acknowledgement sent by the receiver reaches the sender after exceeding the time limit is known as delayed acknowledgement.",
  },
];

export default function Home() {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: newTheme } }));
  };

  const isDark = theme === "dark";
  const colors = getThemeColors(isDark);

  if (!mounted) {
    return null;
  }

  const bgGradient = isDark
    ? "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)"
    : "linear-gradient(135deg, #f0f4f8 0%, #e8f1f6 100%)";
  const buttonBg = isDark
    ? "rgba(0, 212, 255, 0.1)"
    : "rgba(100, 200, 255, 0.1)";
  const buttonBorder = isDark
    ? "2px solid rgba(0, 212, 255, 0.4)"
    : "2px solid rgba(100, 180, 255, 0.6)";
  const buttonColor = isDark ? "#00d4ff" : "#1e40af";
  return (
    <div
      style={{
        minHeight: "100vh",
        background: bgGradient,
        color: colors.text,
        padding: "40px 20px",
        position: "relative",
      }}
    >
      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          padding: "10px 16px",
          background: buttonBg,
          border: buttonBorder,
          borderRadius: 8,
          color: buttonColor,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          transition: "all 0.3s ease",
          zIndex: 100,
          width: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "scale(1.05)";
          e.target.style.boxShadow = isDark
            ? "0 0 12px rgba(0, 212, 255, 0.3)"
            : "0 0 12px rgba(100, 180, 255, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "none";
        }}
      >
        <span>{isDark ? "☀️" : "🌙"}</span>
        <span>{isDark ? "Light" : "Dark"}</span>
      </button>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ marginBottom: 28, textAlign: "center" }}>
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            margin: "0 0 8px",
            color: isDark ? "#00d4ff" : "#0284c7",
            textShadow: isDark ? "0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)" : "none",
          }}>
            Sliding Window Protocols
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: colors.textMuted }}>
            Simple simulations for Stop-and-Wait, Go-Back-N, and Selective
            Repeat.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            marginBottom: 28,
          }}
        >
          <Link href="/stop-and-wait" style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: isDark ? "2px solid #00d4ff" : "2px solid #0284c7",
                background: isDark ? "#1a1f3a" : "#e8f1f6",
                color: isDark ? "#00d4ff" : "#0284c7",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isDark ? "0 0 15px rgba(0, 212, 255, 0.2)" : "0 0 15px rgba(2, 132, 199, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = isDark ? "0 0 30px rgba(0, 212, 255, 0.5)" : "0 0 30px rgba(2, 132, 199, 0.4)";
                e.target.style.background = isDark ? "rgba(0, 212, 255, 0.1)" : "rgba(2, 132, 199, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = isDark ? "0 0 15px rgba(0, 212, 255, 0.2)" : "0 0 15px rgba(2, 132, 199, 0.2)";
                e.target.style.background = isDark ? "#1a1f3a" : "#e8f1f6";
              }}
            >
              Stop-and-Wait
            </button>
          </Link>
          <Link href="/GoBackN" style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: isDark ? "2px solid #a855f7" : "2px solid #7c3aed",
                background: isDark ? "#1a1f3a" : "#e8f1f6",
                color: isDark ? "#a855f7" : "#7c3aed",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isDark ? "0 0 15px rgba(168, 85, 247, 0.2)" : "0 0 15px rgba(124, 58, 237, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = isDark ? "0 0 30px rgba(168, 85, 247, 0.5)" : "0 0 30px rgba(124, 58, 237, 0.4)";
                e.target.style.background = isDark ? "rgba(168, 85, 247, 0.1)" : "rgba(124, 58, 237, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = isDark ? "0 0 15px rgba(168, 85, 247, 0.2)" : "0 0 15px rgba(124, 58, 237, 0.2)";
                e.target.style.background = isDark ? "#1a1f3a" : "#e8f1f6";
              }}
            >
              Go-Back-N
            </button>
          </Link>
          <Link href="/Selective-Repeat" style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: isDark ? "2px solid #00f0ff" : "2px solid #0ea5e9",
                background: isDark ? "#1a1f3a" : "#e8f1f6",
                color: isDark ? "#00f0ff" : "#0ea5e9",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isDark ? "0 0 15px rgba(0, 240, 255, 0.2)" : "0 0 15px rgba(14, 165, 233, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = isDark ? "0 0 30px rgba(0, 240, 255, 0.5)" : "0 0 30px rgba(14, 165, 233, 0.4)";
                e.target.style.background = isDark ? "rgba(0, 240, 255, 0.1)" : "rgba(14, 165, 233, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = isDark ? "0 0 15px rgba(0, 240, 255, 0.2)" : "0 0 15px rgba(14, 165, 233, 0.2)";
                e.target.style.background = isDark ? "#1a1f3a" : "#e8f1f6";
              }}
            >
              Selective Repeat
            </button>
          </Link>
        </section>

        <section
          style={{
            background: isDark ? "#1a1f3a" : "#e8f1f6",
            border: isDark ? "1px solid rgba(0, 212, 255, 0.3)" : "1px solid rgba(2, 132, 199, 0.3)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            boxShadow: isDark ? "0 0 20px rgba(0, 212, 255, 0.1)" : "0 0 20px rgba(2, 132, 199, 0.1)",
          }}
        >
          <h2 style={{ fontSize: 20, margin: "0 0 10px", color: isDark ? "#00d4ff" : "#0284c7" }}>
            About this project
          </h2>
          <p style={{ margin: 0, color: colors.textMuted, lineHeight: 1.6 }}>
            This project demonstrates how sliding window protocols send frames,
            handle acknowledgements, and recover from loss. Use the simulations
            to compare reliability and efficiency trade-offs.
          </p>
        </section>

        <section
          style={{
            background: isDark ? "#1a1f3a" : "#e8f1f6",
            border: isDark ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid rgba(124, 58, 237, 0.3)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 28,
            boxShadow: isDark ? "0 0 20px rgba(168, 85, 247, 0.1)" : "0 0 20px rgba(124, 58, 237, 0.1)",
          }}
        >
          <h2 style={{ fontSize: 20, margin: "0 0 14px", color: isDark ? "#a855f7" : "#7c3aed" }}>
            Types of acknowledgements
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {ACK_TYPES.map((ack) => (
              <div
                key={ack.title}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: isDark ? "rgba(0, 212, 255, 0.05)" : "rgba(2, 132, 199, 0.05)",
                  border: isDark ? "1px solid rgba(0, 240, 255, 0.2)" : "1px solid rgba(14, 165, 233, 0.2)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6, color: isDark ? "#00f0ff" : "#0ea5e9" }}>
                  {ack.title}
                </div>
                <div style={{ color: colors.textMuted, lineHeight: 1.6 }}>
                  {ack.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            borderTop: isDark ? "1px solid rgba(0, 212, 255, 0.2)" : "1px solid rgba(2, 132, 199, 0.2)",
            paddingTop: 16,
            color: colors.textMuted,
            fontSize: 13,
          }}
        >
          Sliding Window Protocols Simulation
        </footer>
      </div>
    </div>
  );
}
