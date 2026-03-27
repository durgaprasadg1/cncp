"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SenderWindow from "../../components/SenderWindow";
import { createPackets } from "../../../utils/packet";
import { stopAndWait } from "../../../protocols/stopAndWait";

const SNW = () => {
  const totalPackets = 10;
  const [state, setState] = useState({
    packets: [],
    base: 0,
    current: 0,
    windowSize: 1,
    lossRate: 0.15
  });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [stats, setStats] = useState({
    sent: 0,
    acked: 0,
    lost: 0,
    lostPackets: [],
    retries: 0,
    timeouts: 0,
    totalRetryAttempts: 0
  });

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      packets: createPackets(totalPackets),
      base: 0
    }));
  }, []);

  useEffect(() => {
    if (!running || paused) return;

    if (state.current >= totalPackets) {
      setRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const newState = stopAndWait(prev);
        
        setStats((s) => {
          const sent = newState.packets.filter(p => p.status === "sent" || p.status === "ack").length;
          const acked = newState.packets.filter(p => p.status === "ack").length;
          const lost = newState.packets.filter(p => p.status === "lost").length;
          const lostPackets = newState.packets
            .filter(p => p.status === "lost")
            .map(p => p.seq);
          const totalRetryAttempts = newState.packets.reduce((sum, p) => sum + p.retryCount, 0);
          const timeouts = newState.packets.filter(p => p.timeout > 0 && p.status !== "ack").length;
          
          return { 
            sent, 
            acked, 
            lost, 
            lostPackets,
            retries: s.retries + (lost > s.lost ? 1 : 0),
            timeouts,
            totalRetryAttempts
          };
        });

        setStepCount((c) => c + 1);
        return newState;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [running, paused, state.current]);

  const handleStart = () => {
    setRunning(true);
    setPaused(false);
  };
  const handleStop = () => setRunning(false);
  const handlePauseResume = () => setPaused(!paused);
  const handleReset = () => {
    setRunning(false);
    setPaused(false);
    setStepCount(0);
    setStats({ sent: 0, acked: 0, lost: 0, lostPackets: [], retries: 0, timeouts: 0, totalRetryAttempts: 0 });
    setState({
      packets: createPackets(totalPackets),
      base: 0,
      current: 0,
      windowSize: 1,
      lossRate: 0.15
    });
  };

  const completionPercent = ((stats.acked / totalPackets) * 100).toFixed(1);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      padding: "30px 20px",
      color: "#0f172a"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/">
            <button style={{
              padding: "10px 20px",
              background: "rgba(30, 41, 59, 0.1)",
              border: "2px solid rgba(15, 23, 42, 0.2)",
              borderRadius: 8,
              color: "#1e293b",
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.3s ease",
              marginBottom: 20
            }}>
              ← Back to Home
            </button>
          </Link>

          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            marginBottom: 8,
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            color: "#0f172a"
          }}>
            ⏱️ Stop-and-Wait Protocol
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, margin: 0, color: "#1e293b" }}>Window Size: <strong>{state.windowSize}</strong> | Loss Rate: <strong>{(state.lossRate * 100).toFixed(0)}%</strong></p>
        </div>

        {/* Controls - 4 Buttons */}
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 32,
          flexWrap: "wrap"
        }}>
          {[
            { label: "▶ Start", onClick: handleStart, bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
            { label: "⏹ Stop", onClick: handleStop, bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
            { label: paused ? "▶ Resume" : "⏸ Pause", onClick: handlePauseResume, bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
            { label: "↻ Reset", onClick: handleReset, bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }
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
                letterSpacing: 0.5
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
        <div style={{
          marginBottom: 30,
          background: "rgba(255,255,255,0.08)",
          border: "2px solid rgba(255,255,255,0.2)",
          borderRadius: 16,
          padding: 32,
          backdropFilter: "blur(10px)"
        }}>
          <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🔄 Sender-Receiver Communication</h3>
          
          {/* Animated Diagram Container */}
          <div style={{ position: "relative", minHeight: 300 }}>
            {/* Sender Side */}
            <div style={{
              position: "absolute",
              left: 30,
              top: 0,
              textAlign: "center"
            }}>
              <div style={{
                width: 80,
                height: 80,
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 700,
                color: "white",
                boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
                border: "2px solid rgba(255,255,255,0.3)"
              }}>
                📤
              </div>
              <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>SENDER</p>
            </div>

            {/* Communication Lines and Animated Packets */}
            <svg style={{ position: "absolute", top: 0, left: 120, right: 120, width: "calc(100% - 240px)", height: "100%" }}>
              {/* Horizontal lines */}
              <line x1="0" y1="40" x2="100%" y2="40" stroke="rgba(71, 85, 99, 0.3)" strokeWidth="2" />
              <line x1="0" y1="140" x2="100%" y2="140" stroke="rgba(71, 85, 99, 0.3)" strokeWidth="2" />
              
              {/* Arrow indicators */}
              <text x="5%" y="35" fontSize="12" fill="rgba(51, 65, 85, 0.7)">Sending →</text>
              <text x="5%" y="135" fontSize="12" fill="rgba(51, 65, 85, 0.7)">← ACK</text>
            </svg>

            {/* Animated Packet */}
            {running && !paused && state.packets[state.current]?.status !== "ack" && (
              <div style={{
                position: "absolute",
                top: 15,
                left: "15%",
                animation: `packageMove 2s ease-in-out infinite`,
                zIndex: 10
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  background: state.packets[state.current]?.status === "lost" 
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "white",
                  fontWeight: 700,
                  boxShadow: `0 6px 20px ${state.packets[state.current]?.status === "lost" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                  border: "2px solid rgba(255,255,255,0.5)"
                }}>
                  {state.current}
                </div>
              </div>
            )}

            {/* Animated ACK */}
            {running && !paused && state.packets[state.current]?.status === "sent" && (
              <div style={{
                position: "absolute",
                top: 115,
                right: "15%",
                animation: `ackMove 2s ease-in-out infinite`,
                zIndex: 10
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "white",
                  fontWeight: 700,
                  boxShadow: "0 6px 20px rgba(245, 158, 11, 0.4)",
                  border: "2px solid rgba(255,255,255,0.5)"
                }}>
                  ✓
                </div>
              </div>
            )}

            {/* Receiver Side */}
            <div style={{
              position: "absolute",
              right: 30,
              top: 0,
              textAlign: "center"
            }}>
              <div style={{
                width: 80,
                height: 80,
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 700,
                color: "white",
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)",
                border: "2px solid rgba(255,255,255,0.3)"
              }}>
                📥
              </div>
              <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>RECEIVER</p>
            </div>

            {/* Current Packet Status */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              textAlign: "center",
              padding: "16px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              fontSize: 13
            }}>
              <strong>Packet </strong> #{state.current} → <strong>Status:</strong> {state.packets[state.current]?.status.toUpperCase() || "COMPLETE"}
            </div>
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes packageMove {
              0% {
                left: 15%;
                opacity: 1;
              }
              50% {
                left: 50%;
              }
              100% {
                left: 85%;
                opacity: 0.7;
              }
            }

            @keyframes ackMove {
              0% {
                right: 15%;
                opacity: 0.7;
              }
              50% {
                right: 50%;
              }
              100% {
                right: 85%;
                opacity: 1;
              }
            }
          `}</style>
        </div>

        {/* Main Content */}
        <div style={{ marginBottom: 30 }}>
          
          {/* All Packets Visualization */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📦 All Packets (Window Size = 1)</h3>
            <SenderWindow 
              packets={state.packets} 
              base={state.current} 
              windowSize={1} 
            />
          </div>

          {/* Info Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16
          }}>
            {/* Current Packet Info */}
            <div style={{
              padding: 16,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: 14,
              backdropFilter: "blur(10px)"
            }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#0f172a" }}>📍 Current Packet</h4>
              <p style={{ margin: "0 0 8px 0" }}><strong>Packet #:</strong> {state.current}</p>
              <p style={{ margin: "0 0 8px 0" }}><strong>Status:</strong> {state.packets[state.current]?.status.toUpperCase() || 'COMPLETE'}</p>
              <p style={{ margin: "0 0 8px 0" }}><strong>Waiting for ACK:</strong> {state.packets[state.current]?.status === "sent" ? "Yes ⏳" : "No ✓"}</p>
              <p style={{ margin: "0 0 6px 0" }}><strong>⏱️ Timeout:</strong> {state.packets[state.current]?.timeout}/10</p>
              <div style={{
                width: "100%",
                height: 6,
                background: "rgba(255, 152, 0, 0.2)",
                borderRadius: 3,
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${(state.packets[state.current]?.timeout / 10) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #FF9800, #FFB74D)",
                  transition: "width 0.3s ease"
                }}></div>
              </div>

              {/* Retry Info */}
              {state.packets[state.current]?.retryCount > 0 && (
                <div style={{
                  marginTop: 12,
                  padding: 10,
                  background: "rgba(244, 67, 54, 0.1)",
                  border: "1px solid rgba(244, 67, 54, 0.5)",
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <p style={{ margin: 0 }}><strong>♻️ Retries:</strong> {state.packets[state.current]?.retryCount}</p>
                </div>
              )}
            </div>

            {/* Simulation State */}
            <div style={{
              padding: 16,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: 14,
              backdropFilter: "blur(10px)"
            }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#0f172a" }}>⚙️ Simulation State</h4>
              <p style={{ margin: "0 0 8px 0" }}><strong>Status:</strong> {running && !paused ? "🟢 Running" : running && paused ? "🟡 Paused" : "⚫ Stopped"}</p>
              <p style={{ margin: "0 0 8px 0" }}><strong>Steps:</strong> {stepCount}</p>
              <p style={{ margin: "0 0 8px 0" }}><strong>Progress:</strong> {state.current}/{totalPackets}</p>
              <div style={{
                width: "100%",
                height: 8,
                background: "rgba(148, 163, 184, 0.2)",
                borderRadius: 4,
                overflow: "hidden",
                marginTop: 12
              }}>
                <div style={{
                  width: `${(state.current / totalPackets) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #4ade80, #22c55e)",
                  transition: "width 0.3s ease"
                }}></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12
            }}>
              {[
                { label: "Sent", value: stats.sent, color: "from-blue-100 to-blue-200" },
                { label: "Acked", value: stats.acked, color: "from-green-100 to-green-200" },
                { label: "Timeouts", value: stats.timeouts, color: "from-orange-100 to-orange-200" },
                { label: "Retries", value: stats.totalRetryAttempts, color: "from-red-100 to-red-200" }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: `linear-gradient(135deg, ${stat.color})`,
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.2)",
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4, fontWeight: 600 }}>{stat.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Completion Progress */}
          <div style={{
            marginTop: 24,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 16,
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span><strong>Overall Completion</strong></span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>{completionPercent}%</span>
            </div>
            <div style={{
              width: "100%",
              height: 12,
              background: "rgba(148, 163, 184, 0.2)",
              borderRadius: 6,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${completionPercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4ade80, #22c55e)",
                transition: "width 0.3s ease",
                borderRadius: 6
              }}></div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div style={{
          background: "linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(226,232,240,0.9) 100%)",
          border: "2px solid rgba(148, 163, 184, 0.3)",
          borderRadius: 16,
          padding: 28,
          backdropFilter: "blur(10px)",
          color: "#0f172a"
        }}>
          <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>ℹ️ Protocol Characteristics & Controls</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8 }}>
            <li><strong>Window Size:</strong> Always 1 - only one packet at a time</li>
            <li><strong>Behavior:</strong> Sender waits for ACK before sending next packet</li>
            <li><strong>Timeout Mechanism:</strong> Retransmits packet if no ACK received after 10 time steps</li>
            <li><strong>Retransmission:</strong> On loss/timeout, resends the same packet automatically</li>
            <li><strong>Visual Indicators:</strong> Orange "Retry" status shows active timeout countdown</li>
            <li><strong>Retry Badge:</strong> Red badge shows number of retry attempts made per packet</li>
            <li><strong>▶ Start Button:</strong> Begins the simulation</li>
            <li><strong>⏹ Stop Button:</strong> Stops the simulation completely</li>
            <li><strong>⏸ Pause/▶ Resume Button:</strong> Pause the packet mid-transmission and resume it later</li>
            <li><strong>↻ Reset Button:</strong> Resets all statistics and packets to initial state</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SNW;
