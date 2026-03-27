"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SenderWindow from "../../components/SenderWindow";
import SimulationControls from "../../components/SimulationControls";
import { createPackets } from "../../../utils/packet";
import { goBackN } from "../../../protocols/goBackN";

const GBN = () => {
  const defaultSettings = {
    totalPackets: 12,
    windowSize: 4,
    dataLossRate: 0.15,
    ackLossRate: 0.1,
    tickMs: 500,
  };

  const buildState = (config) => ({
    packets: createPackets(config.totalPackets),
    base: 0,
    nextSeq: 0,
    windowSize: config.windowSize,
    dataLossRate: config.dataLossRate,
    ackLossRate: config.ackLossRate,
    timeoutSteps: Math.max(3, Math.round(3000 / config.tickMs)),
    baseTimer: 0,
    receiverExpected: 0,
  });

  const [settings, setSettings] = useState(defaultSettings);
  const [tickMs, setTickMs] = useState(defaultSettings.tickMs);
  const [totalPackets, setTotalPackets] = useState(
    defaultSettings.totalPackets,
  );
  const [state, setState] = useState(buildState(defaultSettings));

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [stats, setStats] = useState({
    sent: 0,
    acked: 0,
    lost: 0,
    ackLost: 0,
    retries: 0,
    lostPackets: [],
  });

  useEffect(() => {
    if (!running || paused) return;

    if (state.base >= totalPackets && state.nextSeq >= totalPackets) {
      setRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const newState = goBackN(prev);

        setStats((s) => {
          const sent = newState.packets.filter((p) =>
            ["sent", "ack", "ack-lost", "retrying"].includes(p.status),
          ).length;
          const acked = newState.packets.filter(
            (p) => p.status === "ack",
          ).length;
          const lost = newState.packets.filter(
            (p) => p.status === "lost",
          ).length;
          const ackLost = newState.packets.filter(
            (p) => p.status === "ack-lost",
          ).length;
          const retries = newState.packets.reduce(
            (sum, p) => sum + p.retryCount,
            0,
          );
          const lostPackets = newState.packets
            .filter((p) => p.status === "lost")
            .map((p) => p.seq);

          return { sent, acked, lost, ackLost, retries, lostPackets };
        });

        setStepCount((c) => c + 1);
        return newState;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [running, paused, state.base, state.nextSeq, tickMs, totalPackets]);

  const handleStart = () => {
    setRunning(true);
    setPaused(false);
  };
  const handleStop = () => setRunning(false);
  const handlePauseResume = () => setPaused(!paused);
  const handleApply = () => {
    const normalizedWindow = Math.min(
      settings.windowSize,
      settings.totalPackets,
    );
    const nextSettings = { ...settings, windowSize: normalizedWindow };
    setSettings(nextSettings);
    setTickMs(nextSettings.tickMs);
    setTotalPackets(nextSettings.totalPackets);
    setRunning(false);
    setPaused(false);
    setStepCount(0);
    setStats({
      sent: 0,
      acked: 0,
      lost: 0,
      ackLost: 0,
      retries: 0,
      lostPackets: [],
    });
    setState(buildState(nextSettings));
  };
  const handleReset = () => {
    setRunning(false);
    setPaused(false);
    setStepCount(0);
    setStats({
      sent: 0,
      acked: 0,
      lost: 0,
      ackLost: 0,
      retries: 0,
      lostPackets: [],
    });
    setState(
      buildState({
        ...settings,
        windowSize: Math.min(settings.windowSize, settings.totalPackets),
      }),
    );
  };

  const completionPercent = ((stats.acked / totalPackets) * 100).toFixed(1);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "30px 20px",
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/">
            <button
              style={{
                padding: "10px 20px",
                background: "rgba(30, 41, 59, 0.1)",
                border: "2px solid rgba(15, 23, 42, 0.2)",
                borderRadius: 8,
                color: "#1e293b",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.3s ease",
                marginBottom: 20,
              }}
            >
              ← Back to Home
            </button>
          </Link>

          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              marginBottom: 8,
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              color: "#0f172a",
            }}
          >
            ↩️ Go-Back-N Protocol
          </h1>
          <p
            style={{ fontSize: 18, opacity: 0.9, margin: 0, color: "#1e293b" }}
          >
            Window Size: <strong>{state.windowSize}</strong> | Data Loss:{" "}
            <strong>{(state.dataLossRate * 100).toFixed(0)}%</strong> | ACK
            Loss: <strong>{(state.ackLossRate * 100).toFixed(0)}%</strong>
          </p>
        </div>

        <SimulationControls
          settings={settings}
          onChange={setSettings}
          onApply={handleApply}
          showWindowSize={true}
        />

        {/* Controls - 4 Buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "▶ Start",
              onClick: handleStart,
              bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            },
            {
              label: "⏹ Stop",
              onClick: handleStop,
              bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            },
            {
              label: paused ? "▶ Resume" : "⏸ Pause",
              onClick: handlePauseResume,
              bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            },
            {
              label: "↻ Reset",
              onClick: handleReset,
              bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              style={{
                padding: "12px 28px",
                background: btn.bg,
                border: "none",
                borderRadius: 10,
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 15,
                transition: "all 0.3s ease",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-4px)";
                e.target.style.boxShadow = "0 12px 28px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Animated Communication Diagram */}
        <div
          style={{
            marginBottom: 30,
            background: "rgba(255,255,255,0.08)",
            border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 16,
            padding: 32,
            backdropFilter: "blur(10px)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            🔄 Sender-Receiver Communication
          </h3>

          {/* Animated Diagram Container */}
          <div style={{ position: "relative", minHeight: 300 }}>
            {/* Sender Side */}
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 0,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "white",
                  boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                📤
              </div>
              <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>
                SENDER
              </p>
            </div>

            {/* Communication Lines */}
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 120,
                right: 120,
                width: "calc(100% - 240px)",
                height: "100%",
              }}
            >
              <line
                x1="0"
                y1="40"
                x2="100%"
                y2="40"
                stroke="rgba(71, 85, 99, 0.3)"
                strokeWidth="2"
              />
              <line
                x1="0"
                y1="140"
                x2="100%"
                y2="140"
                stroke="rgba(71, 85, 99, 0.3)"
                strokeWidth="2"
              />
              <text x="5%" y="35" fontSize="12" fill="rgba(51, 65, 85, 0.7)">
                Sending →
              </text>
              <text x="5%" y="135" fontSize="12" fill="rgba(51, 65, 85, 0.7)">
                ← ACK
              </text>
            </svg>

            {/* Animated Packets */}
            {running && !paused && state.nextSeq > state.base && (
              <div
                style={{
                  position: "absolute",
                  top: 15,
                  left: "15%",
                  animation: `packageMove 2s ease-in-out infinite`,
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    color: "white",
                    fontWeight: 700,
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                    border: "2px solid rgba(255,255,255,0.5)",
                  }}
                >
                  📦
                </div>
              </div>
            )}

            {/* Animated ACK */}
            {running && !paused && state.base > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 115,
                  right: "15%",
                  animation: `ackMove 2s ease-in-out infinite`,
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    color: "white",
                    fontWeight: 700,
                    boxShadow: "0 6px 20px rgba(245, 158, 11, 0.4)",
                    border: "2px solid rgba(255,255,255,0.5)",
                  }}
                >
                  ✓
                </div>
              </div>
            )}

            {/* Receiver Side */}
            <div
              style={{
                position: "absolute",
                right: 30,
                top: 0,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "white",
                  boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                📥
              </div>
              <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>
                RECEIVER
              </p>
            </div>

            {/* Status */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                textAlign: "center",
                padding: "16px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <strong>Window:</strong> [{state.base},{" "}
              {Math.min(state.base + state.windowSize - 1, state.nextSeq - 1)}]
            </div>
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes packageMove {
              0% { left: 15%; opacity: 1; }
              50% { left: 50%; }
              100% { left: 85%; opacity: 0.7; }
            }
            @keyframes ackMove {
              0% { right: 15%; opacity: 0.7; }
              50% { right: 50%; }
              100% { right: 85%; opacity: 1; }
            }
          `}</style>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 30,
          }}
        >
          {/* Left: Visualization */}
          <div>
            <h3
              style={{
                marginTop: 0,
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              📦 Packet Window
            </h3>
            <SenderWindow
              packets={state.packets}
              base={state.base}
              windowSize={state.windowSize}
            />
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "rgba(226, 232, 240, 0.6)",
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.3)",
                fontSize: 14,
                color: "#1e293b",
                backdropFilter: "blur(10px)",
              }}
            >
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Base (Oldest unacked):</strong> {state.base}
              </p>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>NextSeq (Next to send):</strong> {state.nextSeq}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Window Range:</strong> [{state.base},{" "}
                {Math.min(state.base + state.windowSize - 1, totalPackets - 1)}]
              </p>
            </div>
          </div>

          {/* Right: Stats */}
          <div>
            <h3
              style={{
                marginTop: 0,
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 16,
                color: "#0f172a",
              }}
            >
              📊 Statistics
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {[
                {
                  label: "Steps",
                  value: stepCount,
                  color: "from-blue-400 to-blue-600",
                },
                {
                  label: "Sent",
                  value: stats.sent,
                  color: "from-cyan-400 to-cyan-600",
                },
                {
                  label: "Acked",
                  value: stats.acked,
                  color: "from-green-400 to-green-600",
                },
                {
                  label: "Lost",
                  value: stats.lost,
                  color: "from-red-400 to-red-600",
                },
                {
                  label: "ACK Lost",
                  value: stats.ackLost,
                  color: "from-yellow-400 to-yellow-600",
                },
                {
                  label: "Retries",
                  value: stats.retries,
                  color: "from-orange-400 to-orange-600",
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: `linear-gradient(135deg, ${stat.color})`,
                    padding: 20,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.2)",
                    textAlign: "center",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.9,
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>Completion</strong>
                </span>
                <span
                  style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}
                >
                  {completionPercent}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 12,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${completionPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #4ade80, #22c55e)",
                    transition: "width 0.3s ease",
                    borderRadius: 6,
                  }}
                ></div>
              </div>
            </div>

            {stats.lost > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "rgba(244, 67, 54, 0.2)",
                  border: "1px solid rgba(244, 67, 54, 0.5)",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                <strong>Lost Packets:</strong> {stats.lostPackets.join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 16,
            padding: 28,
            backdropFilter: "blur(10px)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            ℹ️ Protocol Characteristics
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            <li>
              <strong>Window Size:</strong> Sends multiple packets before
              waiting
            </li>
            <li>
              <strong>Retransmission:</strong> On packet loss, retransmits ALL
              packets from that point
            </li>
            <li>
              <strong>Cumulative ACK:</strong> One ACK acknowledges all packets
              up to sequence number
            </li>
            <li>
              <strong>Efficiency:</strong> Moderate - retransmits unnecessary
              packets
            </li>
            <li>
              <strong>Use Case:</strong> Older networks, moderate-speed links
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GBN;
