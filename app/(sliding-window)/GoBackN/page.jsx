"use client";

import React, {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createPackets } from "../../../utils/packet";
import { goBackN } from "../../../protocols/goBackN";

const TOTAL_PACKETS = 12;
const DATA_LOSS_RATE = 0;
const ACK_LOSS_RATE = 0;
const TIMEOUT_STEPS = 4;
const TICK_MS = 3000;
const ANIMATION_MS = 2200;

const senderStyles = {
  pending: { bg: "#e2e8f0", color: "#0f172a", label: "Pending" },
  sent: { bg: "#38bdf8", color: "#ffffff", label: "Sent" },
  retrying: { bg: "#f97316", color: "#ffffff", label: "Retry" },
  lost: { bg: "#ef4444", color: "#ffffff", label: "Lost" },
  ack: { bg: "#22c55e", color: "#ffffff", label: "ACKed" },
  "ack-lost": { bg: "#f59e0b", color: "#1f2937", label: "ACK lost" },
};

const receiverStyles = {
  pending: { bg: "#e2e8f0", color: "#0f172a", label: "Idle" },
  waiting: { bg: "#dbeafe", color: "#1d4ed8", label: "Expected" },
  received: { bg: "#06b6d4", color: "#ffffff", label: "Accepted" },
  delivered: { bg: "#22c55e", color: "#ffffff", label: "Delivered" },
  duplicate: { bg: "#a855f7", color: "#ffffff", label: "Duplicate" },
  discarded: { bg: "#f97316", color: "#ffffff", label: "Out of order" },
  lost: { bg: "#ef4444", color: "#ffffff", label: "Lost" },
  acklost: { bg: "#f59e0b", color: "#1f2937", label: "ACK lost" },
};

function buildState(windowSize) {
  return {
    packets: createPackets(TOTAL_PACKETS),
    base: 0,
    nextSeq: 0,
    windowSize,
    dataLossRate: DATA_LOSS_RATE,
    ackLossRate: ACK_LOSS_RATE,
    forceDataLoss: false,
    forceAckLoss: false,
    timeoutSteps: TIMEOUT_STEPS,
    baseTimer: 0,
    receiverExpected: 0,
    events: [],
    lastTransmission: null,
  };
}

function getSenderStatus(packet) {
  if (packet.ackReceived) return "ack";
  if (packet.status === "ack-lost") return "ack-lost";
  if (packet.status === "lost") return "lost";
  if (packet.status === "retrying") return "retrying";
  if (packet.status === "sent") return "sent";
  return "pending";
}

function getReceiverStatus(packet, state) {
  const transmission = state.lastTransmission;

  if (packet.ackReceived && packet.received) return "delivered";
  if (transmission?.seq === packet.seq && transmission.dataLost) return "lost";
  if (
    transmission?.seq === packet.seq &&
    transmission.receiverAction === "out-of-order"
  ) {
    return "discarded";
  }
  if (
    transmission?.seq === packet.seq &&
    transmission.receiverAction === "duplicate"
  ) {
    return "duplicate";
  }
  if (packet.received && packet.status === "ack-lost") return "acklost";
  if (packet.received) return "received";
  if (packet.seq === state.receiverExpected) return "waiting";
  return "pending";
}

function getStats(packets) {
  return {
    sent: packets.filter((packet) => packet.sentTime !== null).length,
    acked: packets.filter((packet) => packet.ackReceived).length,
    lost: packets.filter((packet) => packet.status === "lost").length,
    ackLost: packets.filter((packet) => packet.status === "ack-lost").length,
    retries: packets.reduce((sum, packet) => sum + packet.retryCount, 0),
  };
}

function TransmissionBadge({ label, tone, style }) {
  const palettes = {
    info: {
      background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
      shadow: "0 14px 32px rgba(14, 165, 233, 0.35)",
    },
    success: {
      background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
      shadow: "0 14px 32px rgba(34, 197, 94, 0.35)",
    },
    warning: {
      background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
      shadow: "0 14px 32px rgba(249, 115, 22, 0.35)",
    },
    danger: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      shadow: "0 14px 32px rgba(239, 68, 68, 0.35)",
    },
  };

  const palette = palettes[tone];

  return (
    <div
      style={{
        minWidth: 88,
        height: 56,
        padding: "0 18px",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        letterSpacing: 0.3,
        color: "#ffffff",
        border: "2px solid rgba(255,255,255,0.55)",
        boxShadow: palette.shadow,
        background: palette.background,
        ...style,
      }}
    >
      {label}
    </div>
  );
}

export default function GBNPage() {
  const [windowSize, setWindowSize] = useState(4);
  const [state, setState] = useState(() => buildState(4));
  const [running, setRunning] = useState(false);
  const [lossFrame, setLossFrame] = useState(false);
  const [lossAck, setLossAck] = useState(false);
  const [currentLog, setCurrentLog] = useState([]);
  const [animation, setAnimation] = useState(null);
  const [showDialog, setShowDialog] = useState(true);

  const timerRef = useRef(null);
  const lastToastRef = useRef("");

  const stats = useMemo(() => getStats(state.packets), [state.packets]);
  const complete =
    state.base >= TOTAL_PACKETS && state.nextSeq >= TOTAL_PACKETS;

  const progress = ((stats.acked / TOTAL_PACKETS) * 100).toFixed(1);

  const pushToasts = (transmission, events) => {
    if (!transmission || transmission.type === "idle") return;

    const toastKey = JSON.stringify({
      type: transmission.type,
      seq: transmission.seq,
      ackNumber: transmission.ackNumber,
      dataLost: transmission.dataLost,
      ackLost: transmission.ackLost,
      receiverAction: transmission.receiverAction,
      timeout: transmission.timeout,
    });

    if (toastKey === lastToastRef.current) return;
    lastToastRef.current = toastKey;

    if (transmission.dataLost) {
      toast.error(`F${transmission.seq} was lost in the channel.`);
      return;
    }

    if (
      events.length === 1 &&
      events[0] === "All frames have been acknowledged."
    ) {
      toast.success("All frames were delivered successfully.");
      return;
    }

    if (transmission.timeout && transmission.resendRange) {
      toast.warning(
        `Timeout. Go-Back-N is resending from F${transmission.resendRange[0]} to F${transmission.resendRange[1]}.`,
      );
      return;
    }

    if (transmission.receiverAction === "out-of-order") {
      toast.warning(
        `Receiver discarded F${transmission.seq}. Sender still waits for ACK ${transmission.ackNumber}.`,
      );
      return;
    }

    if (transmission.receiverAction === "duplicate") {
      toast.warning(
        `Receiver saw duplicate F${transmission.seq}. ACK ${transmission.ackNumber} goes back to sender.`,
      );
      return;
    }

    if (transmission.ackNumber !== null && transmission.ackLost) {
      toast.warning(
        `Receiver accepted F${transmission.seq}, but ACK ${transmission.ackNumber} was lost.`,
      );
      return;
    }

    if (transmission.ackNumber !== null) {
      toast.success(
        `Receiver accepted F${transmission.seq} and sender received ACK ${transmission.ackNumber}.`,
      );
    }
  };

  const buildAnimation = (transmission) => {
    if (
      !transmission ||
      transmission.type === "idle" ||
      transmission.seq === null
    ) {
      return null;
    }

    return {
      id: `${Date.now()}-${transmission.seq}-${transmission.ackNumber ?? "x"}`,
      transmission,
    };
  };

  const runStep = () => {
    let shouldStop = false;

    setState((previousState) => {
      const nextState = goBackN({
        ...previousState,
        packets: previousState.packets.map((packet) => ({ ...packet })),
        forceDataLoss: lossFrame,
        forceAckLoss: lossAck,
      });

      const logs = nextState.events ?? [];

      setCurrentLog(logs);
      setAnimation(buildAnimation(nextState.lastTransmission));
      pushToasts(nextState.lastTransmission, logs);
      setLossFrame(false);
      setLossAck(false);
      shouldStop =
        nextState.base >= TOTAL_PACKETS && nextState.nextSeq >= TOTAL_PACKETS;

      return {
        ...nextState,
        forceDataLoss: false,
        forceAckLoss: false,
      };
    });

    if (shouldStop) {
      setRunning(false);
    }
  };

  const onTick = useEffectEvent(() => {
    runStep();
  });

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = null;
      return undefined;
    }

    timerRef.current = setInterval(() => {
      onTick();
    }, TICK_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (!animation) return undefined;

    const timeout = setTimeout(() => {
      setAnimation(null);
    }, ANIMATION_MS);

    return () => clearTimeout(timeout);
  }, [animation]);

  const handleStart = () => {
    if (complete) return;
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
  };

  const handleReset = () => {
    setRunning(false);
    setLossFrame(false);
    setLossAck(false);
    setCurrentLog([]);
    setAnimation(null);
    lastToastRef.current = "";
    setState(buildState(windowSize));
  };

  const handleWindowChange = (value) => {
    if (running) return;
    const nextWindow = Math.max(1, Math.min(TOTAL_PACKETS, Number(value) || 1));
    setWindowSize(nextWindow);
    setCurrentLog([]);
    setAnimation(null);
    lastToastRef.current = "";
    setState(buildState(nextWindow));
  };

  const activeTransmission = animation?.transmission;
  const activeFrameTone = activeTransmission?.dataLost
    ? "danger"
    : activeTransmission?.type === "retransmission"
      ? "warning"
      : "info";
  const activeAckTone = activeTransmission?.ackLost
    ? "danger"
    : activeTransmission?.receiverAction === "accepted"
      ? "success"
      : "warning";

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
              Go-Back-N at a glance
            </h2>
            <p style={{ margin: "0 0 8px", color: "#334155", lineHeight: 1.6 }}>
              Sender can pipeline up to N frames. A single timeout makes it
              retransmit from the oldest unacknowledged frame. Receiver only
              accepts the next in-order frame and emits cumulative ACKs.
            </p>
            <p
              style={{ margin: "0 0 14px", color: "#334155", lineHeight: 1.6 }}
            >
              Controls: pick window size before starting, then use
              Start/Stop/Reset. Press &quot;Loss Frame&quot; or &quot;Loss
              ACK&quot; once to drop the next frame or ACK and see how recovery
              works.
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
        <div style={{ marginBottom: 28 }}>
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
        </div>

        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "minmax(0, 2.2fr) minmax(320px, 1fr)",
            alignItems: "start",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              padding: 28,
              borderRadius: 26,
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "#0369a1",
              }}
            >
              Sliding Window Simulation
            </p>
            <h1 style={{ margin: "0 0 10px", fontSize: 42, lineHeight: 1.1 }}>
              Go-Back-N Protocol
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.7,
                color: "#334155",
              }}
            >
              This version shows the actual order of transmission, receiver
              action, cumulative ACK handling, timeout-based Go-Back-N resend,
              and manual frame or ACK loss injection for demonstration.
            </p>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 24,
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                textTransform: "uppercase",
                opacity: 0.75,
              }}
            >
              Completion
            </div>
            <div
              style={{ fontSize: 40, fontWeight: 800, margin: "10px 0 8px" }}
            >
              {progress}%
            </div>
            <div
              style={{
                width: "100%",
                height: 12,
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg, #22c55e 0%, #06b6d4 100%)",
                  transition: "width 0.35s ease",
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                ["Sent", stats.sent],
                ["ACKed", stats.acked],
                ["Lost", stats.lost],
                ["ACK Lost", stats.ackLost],
                ["Retries", stats.retries],
                ["Base", state.base],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            marginBottom: 22,
            padding: 18,
            borderRadius: 22,
            background: "rgba(255,255,255,0.78)",
            border: "1px solid rgba(148, 163, 184, 0.28)",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(140px, max-content))",
              gap: 12,
              alignItems: "end",
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Window Size
              <input
                type="number"
                min={1}
                max={TOTAL_PACKETS}
                value={windowSize}
                disabled={running}
                onChange={(event) => handleWindowChange(event.target.value)}
                style={{
                  width: 120,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148, 163, 184, 0.45)",
                  background: "#ffffff",
                }}
              />
            </label>

            <button
              onClick={handleStart}
              disabled={running || complete}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                color: "#ffffff",
                fontWeight: 800,
                cursor: running || complete ? "not-allowed" : "pointer",
                opacity: running || complete ? 0.45 : 1,
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                boxShadow:
                  running || complete
                    ? "none"
                    : "0 16px 30px rgba(15, 23, 42, 0.12)",
              }}
            >
              Start
            </button>

            <button
              onClick={handleStop}
              disabled={!running}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                color: "#ffffff",
                fontWeight: 800,
                cursor: !running ? "not-allowed" : "pointer",
                opacity: !running ? 0.45 : 1,
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: !running
                  ? "none"
                  : "0 16px 30px rgba(15, 23, 42, 0.12)",
              }}
            >
              Stop
            </button>

            <button
              onClick={handleReset}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                color: "#ffffff",
                fontWeight: 800,
                cursor: "pointer",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 16px 30px rgba(15, 23, 42, 0.12)",
              }}
            >
              Reset
            </button>

            <button
              onClick={() => setLossFrame(true)}
              disabled={!running || lossFrame}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                color: "#ffffff",
                fontWeight: 800,
                cursor: !running || lossFrame ? "not-allowed" : "pointer",
                opacity: !running || lossFrame ? 0.45 : 1,
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                boxShadow:
                  !running || lossFrame
                    ? "none"
                    : "0 16px 30px rgba(15, 23, 42, 0.12)",
              }}
            >
              {lossFrame ? "Frame Loss Armed" : "Loss Frame"}
            </button>

            <button
              onClick={() => setLossAck(true)}
              disabled={!running || lossAck}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                color: "#ffffff",
                fontWeight: 800,
                cursor: !running || lossAck ? "not-allowed" : "pointer",
                opacity: !running || lossAck ? 0.45 : 1,
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                boxShadow:
                  !running || lossAck
                    ? "none"
                    : "0 16px 30px rgba(15, 23, 42, 0.12)",
              }}
            >
              {lossAck ? "ACK Loss Armed" : "Loss ACK"}
            </button>
          </div>
        </div>

        <div
          style={{
            marginBottom: 22,
            padding: 24,
            borderRadius: 24,
            background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
            color: "#e2e8f0",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            boxShadow: "0 28px 60px rgba(15, 23, 42, 0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24 }}>Communication Flow</h2>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                fontSize: 13,
              }}
            >
              <span>Base: {state.base}</span>
              <span>NextSeq: {state.nextSeq}</span>
              <span>Receiver expects: F{state.receiverExpected}</span>
              <span>One step every: 3 seconds</span>
              <span>Timeout after: {TIMEOUT_STEPS} ticks</span>
            </div>
          </div>

          <div style={{ position: "relative", minHeight: 260 }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 28,
                width: 160,
                padding: 20,
                borderRadius: 20,
                background: "rgba(59, 130, 246, 0.18)",
                border: "1px solid rgba(96, 165, 250, 0.35)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800 }}>Sender</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
                Window [{state.base},{" "}
                {Math.min(state.base + state.windowSize - 1, TOTAL_PACKETS - 1)}
                ]
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                right: 0,
                top: 28,
                width: 160,
                padding: 20,
                borderRadius: 20,
                background: "rgba(168, 85, 247, 0.18)",
                border: "1px solid rgba(196, 181, 253, 0.35)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800 }}>Receiver</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
                Waiting for F{state.receiverExpected}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 160,
                right: 160,
                top: 56,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(56, 189, 248, 0.4), rgba(34, 197, 94, 0.4))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 160,
                right: 160,
                top: 156,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(245, 158, 11, 0.4), rgba(251, 191, 36, 0.4))",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 190,
                top: 28,
                fontSize: 12,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.7)",
              }}
            >
              Data frames
            </div>
            <div
              style={{
                position: "absolute",
                left: 190,
                top: 128,
                fontSize: 12,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.7)",
              }}
            >
              ACKs
            </div>

            {activeTransmission && (
              <>
                <TransmissionBadge
                  label={`F${activeTransmission.seq}`}
                  tone={activeFrameTone}
                  style={{
                    position: "absolute",
                    top: 28,
                    left: 170,
                    animation: `frameTravel ${ANIMATION_MS}ms ease-in-out forwards`,
                  }}
                />
                {!activeTransmission.dataLost &&
                  activeTransmission.ackNumber !== null && (
                    <TransmissionBadge
                      label={`ACK ${activeTransmission.ackNumber}`}
                      tone={activeAckTone}
                      style={{
                        position: "absolute",
                        top: 128,
                        right: 170,
                        animation: `ackTravel ${ANIMATION_MS}ms ease-in-out forwards`,
                      }}
                    />
                  )}
              </>
            )}

            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  Current event
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6 }}>
                  {currentLog.length > 0
                    ? currentLog.join(" ")
                    : "Press Start to begin the simulation."}
                </div>
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  Manual loss controls
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>
                  Next frame loss:{" "}
                  <strong>{lossFrame ? "Armed" : "Off"}</strong>
                  <br />
                  Next ACK loss: <strong>{lossAck ? "Armed" : "Off"}</strong>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes frameTravel {
              0% { transform: translateX(0) scale(0.92); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translateX(calc(100vw - 760px)) scale(1); opacity: 1; }
            }
            @keyframes ackTravel {
              0% { transform: translateX(0) scale(0.92); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translateX(calc(-100vw + 760px)) scale(1); opacity: 1; }
            }
            @media (max-width: 980px) {
              @keyframes frameTravel {
                0% { transform: translateX(0) scale(0.92); opacity: 0; }
                20% { opacity: 1; }
                100% { transform: translateX(calc(100vw - 620px)) scale(1); opacity: 1; }
              }
              @keyframes ackTravel {
                0% { transform: translateX(0) scale(0.92); opacity: 0; }
                20% { opacity: 1; }
                100% { transform: translateX(calc(-100vw + 620px)) scale(1); opacity: 1; }
              }
            }
          `}</style>
        </div>

        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.2fr)",
            alignItems: "start",
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(148, 163, 184, 0.28)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 20 }}>
              Sender Frames
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
                gap: 12,
              }}
            >
              {state.packets.map((packet) => {
                const status = getSenderStatus(packet);
                const palette = senderStyles[status];
                const inWindow =
                  packet.seq >= state.base &&
                  packet.seq < state.base + state.windowSize &&
                  !packet.ackReceived;

                return (
                  <div
                    key={`sender-${packet.seq}`}
                    style={{
                      padding: "14px 10px",
                      borderRadius: 16,
                      background: palette.bg,
                      color: palette.color,
                      border: inWindow
                        ? "2px solid #0f172a"
                        : "1px solid rgba(15,23,42,0.14)",
                      boxShadow: inWindow
                        ? "0 10px 24px rgba(15,23,42,0.12)"
                        : "none",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 20 }}>
                      F{packet.seq}
                    </div>
                    <div
                      style={{ fontSize: 12, marginTop: 6, fontWeight: 700 }}
                    >
                      {palette.label}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 8, opacity: 0.86 }}>
                      Retry: {packet.retryCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(148, 163, 184, 0.28)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 20 }}>
              Receiver View
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
                gap: 12,
              }}
            >
              {state.packets.map((packet) => {
                const status = getReceiverStatus(packet, state);
                const palette = receiverStyles[status];
                const expected = packet.seq === state.receiverExpected;

                return (
                  <div
                    key={`receiver-${packet.seq}`}
                    style={{
                      padding: "14px 10px",
                      borderRadius: 16,
                      background: palette.bg,
                      color: palette.color,
                      border: expected
                        ? "2px dashed #7c3aed"
                        : "1px solid rgba(15,23,42,0.14)",
                      boxShadow: expected
                        ? "0 10px 24px rgba(124,58,237,0.16)"
                        : "none",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 20 }}>
                      R{packet.seq}
                    </div>
                    <div
                      style={{ fontSize: 12, marginTop: 6, fontWeight: 700 }}
                    >
                      {palette.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(148, 163, 184, 0.28)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 20 }}>
              Notes
            </h3>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#0f172a" }}>
              Watch the in-flight labels on the arrows above. The sender window
              outline shows what can be sent; the receiver highlights only the
              next expected frame. Loss buttons apply to the very next frame or
              ACK, once.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
