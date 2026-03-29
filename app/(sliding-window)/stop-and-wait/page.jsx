"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SenderWindow from "../../components/SenderWindow";
import { createPackets } from "../../../utils/packet";
import { toast } from "sonner";

const SNW = () => {
  const TIMER_MIN = 5;
  const TIMER_MAX = 7;
  const TICK_MS = 1000;
  const TRAVEL_SECONDS = 2;

  const nextTimerSeconds = () =>
    Math.floor(Math.random() * (TIMER_MAX - TIMER_MIN + 1)) + TIMER_MIN;

  const [totalPackets, setTotalPackets] = useState(10);
  const [packets, setPackets] = useState(createPackets(10));
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [countdown, setCountdown] = useState(0);
  const [travelRemaining, setTravelRemaining] = useState(0);
  const [losePacket, setLosePacket] = useState(false);
  const [loseAck, setLoseAck] = useState(false);
  const [sendCycle, setSendCycle] = useState(0);
  const [ackCycle, setAckCycle] = useState(0);
  const [showDialog, setShowDialog] = useState(true);

  const [running, setRunning] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [stats, setStats] = useState({
    sent: 0,
    acked: 0,
    lost: 0,
    lostPackets: [],
    totalRetryAttempts: 0,
    ackLost: 0,
  });

  const prepareSend = (index) => {
    setPhase("sending");
    setLosePacket(false);
    setLoseAck(false);
    setSendCycle((c) => c + 1);
    setTravelRemaining(TRAVEL_SECONDS);
    setPackets((prev) => {
      const next = [...prev];
      const packet = next[index];
      next[index] = {
        ...packet,
        status: packet.retryCount > 0 ? "retrying" : "sent",
      };
      return next;
    });
  };

  const prepareAck = () => {
    setPhase("ack");
    setLoseAck(false);
    setAckCycle((c) => c + 1);
    setTravelRemaining(TRAVEL_SECONDS);
  };

  useEffect(() => {
    if (!running) return;

    if (current >= totalPackets) {
      setRunning(false);
      setPhase("done");
      return;
    }

    if (phase === "idle") {
      prepareSend(current);
      setCountdown(nextTimerSeconds());
    }

    const interval = setInterval(() => {
      if (phase === "sending") {
        if (!losePacket && travelRemaining <= 1) {
          toast.info(`Packet ${current} reached receiver.`);
          prepareAck();
          setCountdown(nextTimerSeconds());
          setTravelRemaining(TRAVEL_SECONDS);
          return;
        }

        if (losePacket && countdown <= 1) {
          setPackets((prevPackets) => {
            const next = [...prevPackets];
            const packet = next[current];
            next[current] = {
              ...packet,
              status: "lost",
              retryCount: packet.retryCount + 1,
            };
            return next;
          });
          toast.error(`Packet ${current} lost. Resending...`);
          setLosePacket(false);
          prepareSend(current);
          setCountdown(nextTimerSeconds());
          setTravelRemaining(TRAVEL_SECONDS);
          return;
        }
      }

      if (phase === "ack") {
        if (!loseAck && travelRemaining <= 1) {
          setPackets((prevPackets) => {
            const next = [...prevPackets];
            const packet = next[current];
            next[current] = {
              ...packet,
              status: "ack",
              ackReceived: true,
            };
            return next;
          });
          toast.success(`ACK received for packet ${current}.`);

          const nextPacket = current + 1;
          setCurrent(nextPacket);
          if (nextPacket >= totalPackets) {
            setPhase("done");
            setRunning(false);
            return;
          }

          prepareSend(nextPacket);
          setCountdown(nextTimerSeconds());
          setTravelRemaining(TRAVEL_SECONDS);
          return;
        }

        if (loseAck && countdown <= 1) {
          setPackets((prevPackets) => {
            const next = [...prevPackets];
            const packet = next[current];
            next[current] = {
              ...packet,
              status: "ack-lost",
              retryCount: packet.retryCount + 1,
              ackLostCount: packet.ackLostCount + 1,
            };
            return next;
          });
          toast.error(`ACK for packet ${current} lost. Sending again...`);
          setLoseAck(false);
          prepareSend(current);
          setCountdown(nextTimerSeconds());
          setTravelRemaining(TRAVEL_SECONDS);
          return;
        }
      }

      setCountdown((prev) => Math.max(0, prev - 1));
      setTravelRemaining((prev) => Math.max(0, prev - 1));

      setStepCount((c) => c + 1);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [
    running,
    phase,
    current,
    totalPackets,
    losePacket,
    loseAck,
    countdown,
    travelRemaining,
  ]);

  useEffect(() => {
    const sent = packets.filter((p) =>
      ["sent", "ack", "ack-lost", "retrying"].includes(p.status),
    ).length;
    const acked = packets.filter((p) => p.status === "ack").length;
    const lost = packets.filter((p) => p.status === "lost").length;
    const ackLost = packets.reduce((sum, p) => sum + p.ackLostCount, 0);
    const totalRetryAttempts = packets.reduce(
      (sum, p) => sum + p.retryCount,
      0,
    );
    const lostPackets = packets
      .filter((p) => p.status === "lost")
      .map((p) => p.seq);

    setStats({
      sent,
      acked,
      lost,
      lostPackets,
      totalRetryAttempts,
      ackLost,
    });
  }, [packets]);

  const handleStart = () => {
    if (current >= totalPackets) return;
    setRunning(true);
  };
  const handleStop = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setStepCount(0);
    setPhase("idle");
    setCountdown(0);
    setTravelRemaining(0);
    setLosePacket(false);
    setLoseAck(false);
    setCurrent(0);
    setSendCycle(0);
    setAckCycle(0);
    setPackets(createPackets(totalPackets));
  };

  const handlePacketCountChange = (value) => {
    if (running) return;
    const nextCount = Math.max(1, Math.min(60, Number(value) || 1));
    setTotalPackets(nextCount);
    setPackets(createPackets(nextCount));
    setCurrent(0);
    setPhase("idle");
    setCountdown(0);
    setTravelRemaining(0);
    setLosePacket(false);
    setLoseAck(false);
    setStepCount(0);
    setSendCycle(0);
    setAckCycle(0);
  };

  const completionPercent = ((stats.acked / totalPackets) * 100).toFixed(1);

  const lossPacketDisabled =
    !running || phase !== "sending" || losePacket || current >= totalPackets;
  const lossAckDisabled =
    !running || phase !== "ack" || loseAck || current >= totalPackets;
  const stopDisabled = !running;
  const resetDisabled = running || (phase === "idle" && current === 0);

  return (
    <div>
      {showDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
              color: "#0f172a",
            }}
          >
            <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>
              Stop-and-Wait at a glance
            </h2>
            <p style={{ margin: "0 0 8px", color: "#334155", lineHeight: 1.6 }}>
              Sends a single packet, waits for its ACK, then moves on. With
              window size 1, every loss forces a retry of the same packet before
              the next one can go.
            </p>
            <p
              style={{ margin: "0 0 14px", color: "#334155", lineHeight: 1.6 }}
            >
              Controls: choose packet count before starting. Use
              Start/Stop/Reset to run the demo. Tap "Loss Packet" or "Loss ACK"
              once to drop the next in-flight packet or acknowledgment and watch
              the resend.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDialog(false)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
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
            ⏱️ Stop-and-Wait Protocol
          </h1>
          <p
            style={{ fontSize: 18, opacity: 0.9, margin: 0, color: "#1e293b" }}
          >
            Window Size: <strong>1</strong> | Timer: {TIMER_MIN}-{TIMER_MAX}s
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(148, 163, 184, 0.4)",
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
              Packets
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={totalPackets}
              disabled={running}
              onChange={(e) => handlePacketCountChange(e.target.value)}
              style={{
                width: 80,
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid rgba(148, 163, 184, 0.6)",
              }}
            />
          </div>

          {[
            {
              label: "▶ Start",
              onClick: handleStart,
              bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              disabled: running || current >= totalPackets,
            },
            {
              label: "⏹ Stop",
              onClick: handleStop,
              bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              disabled: stopDisabled,
            },
            {
              label: "↻ Reset",
              onClick: handleReset,
              bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              disabled: resetDisabled,
            },
            {
              label: "✖ Loss Packet",
              onClick: () => setLosePacket(true),
              bg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              disabled: lossPacketDisabled,
            },
            {
              label: "✖ Loss ACK",
              onClick: () => setLoseAck(true),
              bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              disabled: lossAckDisabled,
            },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              disabled={btn.disabled}
              style={{
                padding: "12px 24px",
                background: btn.bg,
                border: "none",
                borderRadius: 10,
                color: "white",
                cursor: btn.disabled ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 14,
                transition: "all 0.3s ease",
                boxShadow: btn.disabled ? "none" : "0 8px 20px rgba(0,0,0,0.2)",
                textTransform: "uppercase",
                letterSpacing: 0.4,
                opacity: btn.disabled ? 0.5 : 1,
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Animated Communication Diagram */}
        <div
          style={{
            marginBottom: 2,
            background: "",
            border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 16,
            // padding: 32,
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center justify-between mb-8">
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
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                textAlign: "center",
                padding: "16px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                fontSize: 13,
              }}
              className="flex items-center justify-center font-medium text-2xl mt-5 ml-60"
            >
              {/* <strong>Packet </strong> #{current} → <strong>Status:</strong>{" "}
                {(packets[current]?.status || "complete").toUpperCase()} |{" "}
                <strong>Phase:</strong> {phase.toUpperCase()} |{" "} */}
              <div className="h-15 w-23 flex items-center justify-center bg-amber-300">
                <strong className="text-xl">Timer:{countdown}s</strong>
              </div>
            </div>
          </div>

          {/* Animated Diagram Container */}
          <div style={{ position: "relative", minHeight: 300 }}>
            {/* Current Packet Status */}

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

            {/* Communication Lines and Animated Packets */}
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
              {/* Horizontal lines */}
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

              {/* Arrow indicators */}
              <text x="5%" y="35" fontSize="12" fill="rgba(51, 65, 85, 0.7)">
                Sending →
              </text>
              <text x="5%" y="135" fontSize="12" fill="rgba(51, 65, 85, 0.7)">
                ← ACK
              </text>
            </svg>

            {/* Animated Packet */}
            {running && phase === "sending" && (
              <div
                key={`send-${sendCycle}`}
                style={{
                  position: "absolute",
                  top: 15,
                  left: "15%",
                  animationName: "packageMove",
                  animationDuration: `${TRAVEL_SECONDS}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: 1,
                  animationFillMode: "forwards",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background: losePacket
                      ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    color: "white",
                    fontWeight: 700,
                    boxShadow: `0 6px 20px ${losePacket ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                    border: "2px solid rgba(255,255,255,0.5)",
                  }}
                >
                  {current}
                </div>
              </div>
            )}

            {/* Animated ACK */}
            {running && phase === "ack" && (
              <div
                key={`ack-${ackCycle}`}
                style={{
                  position: "absolute",
                  top: 115,
                  right: "15%",
                  animationName: "ackMove",
                  animationDuration: `${TRAVEL_SECONDS}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: 1,
                  animationFillMode: "forwards",
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
                  {loseAck ? "✖" : "✓"}
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

            {/* Current Packet Status */}
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
            <h3
              style={{
                marginTop: 0,
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              📦 All Packets (Window Size = 1)
            </h3>
            <SenderWindow packets={packets} base={current} windowSize={1} />
          </div>

          {/* Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            <p style={{ margin: "0 0 8px 0" }}>
              <strong>Status:</strong>{" "}
              {packets[current]?.status.toUpperCase() || "COMPLETE"}
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              <strong>Waiting for ACK:</strong>{" "}
              {phase === "ack" ? "Yes ⏳" : "No ✓"}
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              <strong>⏱️ Timer:</strong> {countdown}s
            </p>
            {/* <div
              style={{
                width: "100%",
                height: 6,
                background: "rgba(255, 152, 0, 0.2)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(countdown / TIMER_MAX) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #FF9800, #FFB74D)",
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div> */}

            {/* Retry Info */}
            {packets[current]?.retryCount > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  background: "black",
                  border: "1px solid rgba(244, 67, 54, 0.5)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <p style={{ margin: 0 }}>
                  <strong>♻️ Retries:</strong> {packets[current]?.retryCount}
                </p>
              </div>
            )}
          </div>

          {/* Simulation State */}
          <div
            style={{
              padding: 16,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: 14,
              backdropFilter: "blur(10px)",
            }}
          >
            <p style={{ margin: "0 0 8px 0" }}>
              <strong>Progress:</strong> {current}/{totalPackets}
            </p>
            <div
              style={{
                width: "100%",
                height: 8,
                background: "rgba(148, 163, 184, 0.2)",
                borderRadius: 4,
                overflow: "hidden",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  width: `${(current / totalPackets) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #4ade80, #22c55e)",
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {[
              {
                label: "Sent",
                value: stats.sent,
                color: "from-blue-100 to-blue-200",
              },
              {
                label: "Acked",
                value: stats.acked,
                color: "from-green-100 to-green-200",
              },
              {
                label: "Retries",
                value: stats.totalRetryAttempts,
                color: "from-red-100 to-red-200",
              },
              {
                label: "ACK Lost",
                value: stats.ackLost,
                color: "from-yellow-100 to-yellow-200",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  background: `linear-gradient(135deg, ${stat.color})`,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.9,
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Progress */}
        <div
          style={{
            marginTop: 24,
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
          ></div>
        </div>
      </div>

      {/* Info Panel */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(226,232,240,0.9) 100%)",
          border: "2px solid rgba(148, 163, 184, 0.3)",
          borderRadius: 16,
          padding: 28,
          backdropFilter: "blur(10px)",
          color: "#0f172a",
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
          ℹ️ Protocol Characteristics & Controls
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
            <strong>Window Size:</strong> Always 1 - only one packet at a time
          </li>
          <li>
            <strong>Behavior:</strong> Sender waits for ACK before sending next
            packet
          </li>
          <li>
            <strong>Timer:</strong> Each send and ACK waits {TIMER_MIN}-
            {TIMER_MAX}s
          </li>
          <li>
            <strong>Retransmission:</strong> On loss, resends the same packet
          </li>
          <li>
            <strong>Loss Controls:</strong> Use "Loss Packet" or "Loss ACK"
            during the timer window to simulate drops
          </li>
          <li>
            <strong>Retry Badge:</strong> Red badge shows retries per packet
          </li>
          <li>
            <strong>▶ Start Button:</strong> Begins the simulation
          </li>
          <li>
            <strong>⏹ Stop Button:</strong> Pauses the simulation
          </li>
          <li>
            <strong>↻ Reset Button:</strong> Resets all statistics and packets
            to initial state
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SNW;
