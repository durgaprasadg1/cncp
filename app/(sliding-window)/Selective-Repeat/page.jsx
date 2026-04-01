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
import { selectiveRepeat } from "../../../protocols/selectiveRepeat";

const DEFAULT_PACKETS = 12;
const TIMEOUT = 6;
const TICK_MS = 6000;
const ANIM_MS = 5500;
const MAX_LOGS = 10;

const senderStyles = {
  pending: ["#e2e8f0", "#0f172a", "Pending"],
  sent: ["#38bdf8", "#ffffff", "Sent"],
  retrying: ["#f97316", "#ffffff", "Retry"],
  lost: ["#ef4444", "#ffffff", "Lost"],
  ack: ["#22c55e", "#ffffff", "ACKed"],
  "ack-lost": ["#f59e0b", "#1f2937", "ACK lost"],
};

const receiverStyles = {
  pending: ["#e2e8f0", "#0f172a", "Idle"],
  waiting: ["#dbeafe", "#1d4ed8", "Rn"],
  buffered: ["#a855f7", "#ffffff", "Buffered"],
  delivered: ["#22c55e", "#ffffff", "Delivered"],
  duplicate: ["#f59e0b", "#1f2937", "Duplicate"],
  lost: ["#ef4444", "#ffffff", "Lost"],
};

const toneStyles = {
  info: [
    "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    "0 14px 32px rgba(14, 165, 233, 0.35)",
  ],
  success: [
    "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    "0 14px 32px rgba(34, 197, 94, 0.35)",
  ],
  warning: [
    "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    "0 14px 32px rgba(249, 115, 22, 0.35)",
  ],
  danger: [
    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    "0 14px 32px rgba(239, 68, 68, 0.35)",
  ],
  purple: [
    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    "0 14px 32px rgba(139, 92, 246, 0.35)",
  ],
};

function buildState(windowSize, totalPackets) {
  return {
    packets: createPackets(totalPackets).map((packet) => ({
      ...packet,
      receiverBuffered: false,
      receiverDelivered: false,
      nakCount: 0,
    })),
    base: 0,
    nextSeq: 0,
    windowSize,
    dataLossRate: 0,
    ackLossRate: 0,
    forceDataLoss: false,
    forceAckLoss: false,
    timeoutSteps: TIMEOUT,
    receiverBase: 0,
    nakQueue: [],
    pendingNak: null,
    events: [],
    lastTransmission: null,
  };
}

function senderStatus(packet) {
  if (packet.ackReceived) return "ack";
  if (packet.status === "ack-lost") return "ack-lost";
  if (packet.status === "lost") return "lost";
  if (packet.status === "retrying") return "retrying";
  if (packet.status === "sent") return "sent";
  return "pending";
}

function receiverStatus(packet, state) {
  const tx = state.lastTransmission;
  if (packet.receiverDelivered) return "delivered";
  if (packet.seq === state.receiverBase) return "waiting";
  if (tx?.seq === packet.seq && tx.dataLost) return "lost";
  if (tx?.seq === packet.seq && tx.receiverAction === "duplicate")
    return "duplicate";
  if (packet.receiverBuffered) return "buffered";
  return "pending";
}

function statsFrom(packets) {
  return {
    sent: packets.filter((p) => p.sentTime !== null).length,
    acked: packets.filter((p) => p.ackReceived).length,
    lost: packets.filter((p) => p.status === "lost").length,
    ackLost: packets.filter((p) => p.status === "ack-lost").length,
    retries: packets.reduce((sum, p) => sum + p.retryCount, 0),
    buffered: packets.filter((p) => p.receiverBuffered && !p.receiverDelivered)
      .length,
  };
}

function Badge({ label, tone, style }) {
  const [background, shadow] = toneStyles[tone];
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
        color: "#fff",
        border: "2px solid rgba(255,255,255,0.55)",
        background,
        boxShadow: shadow,
        ...style,
      }}
    >
      {label}
    </div>
  );
}

function FrameCard({ title, packetLabel, styleTuple, extra, highlight }) {
  const [bg, color, label] = styleTuple;
  return (
    <div
      style={{
        padding: "14px 10px",
        borderRadius: 16,
        background: bg,
        color,
        border: highlight
          ? "2px solid #0f172a"
          : "1px solid rgba(15,23,42,0.14)",
        boxShadow: highlight ? "0 10px 24px rgba(15,23,42,0.12)" : "none",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 20 }}>{title}</div>
      <div style={{ fontSize: 12, marginTop: 6, fontWeight: 700 }}>{label}</div>
      {packetLabel ? (
        <div style={{ fontSize: 11, marginTop: 8, opacity: 0.86 }}>
          {packetLabel}
        </div>
      ) : null}
      {extra}
    </div>
  );
}

export default function SelectiveRepeatPage() {
  const [windowSize, setWindowSize] = useState(4);
  const [totalPackets, setTotalPackets] = useState(DEFAULT_PACKETS);
  const [state, setState] = useState(() => buildState(4, DEFAULT_PACKETS));
  const [running, setRunning] = useState(false);
  const [lossFrame, setLossFrame] = useState(false);
  const [lossAck, setLossAck] = useState(false);
  const [currentLog, setCurrentLog] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [animation, setAnimation] = useState(null);
  const [showDialog, setShowDialog] = useState(true);
  const timerRef = useRef(null);
  const lastToastRef = useRef("");

  const stats = useMemo(() => statsFrom(state.packets), [state.packets]);
  const complete = state.base >= totalPackets && state.nextSeq >= totalPackets;
  const progress = ((stats.acked / totalPackets) * 100).toFixed(1);

  const pushToasts = (tx, events) => {
    if (!tx || tx.type === "idle") return;
    const key = JSON.stringify(tx);
    if (key === lastToastRef.current) return;
    lastToastRef.current = key;

    if (tx.dataLost) {
      toast.error(`F${tx.seq} was lost in the channel.`);
      return;
    }
    if (
      events.length === 1 &&
      events[0] === "All frames have been selectively acknowledged."
    ) {
      toast.success("Selective Repeat completed successfully.");
      return;
    }
    if (tx.receiverAction === "buffered") {
      toast.warning(
        `Receiver buffered F${tx.seq} and sent NAK-${tx.nakNumber} for the missing frame.`,
      );
      return;
    }
    if (tx.receiverAction === "duplicate") {
      toast.warning(
        `Receiver got duplicate F${tx.seq} and replied with ACK-${tx.ackNumber}.`,
      );
      return;
    }
    if (tx.ackNumber !== null && tx.ackLost) {
      toast.warning(
        `Receiver accepted F${tx.seq}, but ACK-${tx.ackNumber} was lost.`,
      );
      return;
    }
    if (tx.ackNumber !== null) {
      toast.success(
        `Receiver accepted F${tx.seq} and sender received ACK-${tx.ackNumber}.`,
      );
    }
  };

  const buildAnimation = (tx) => {
    if (!tx || tx.type === "idle" || tx.seq === null) return null;
    return { id: `${Date.now()}-${tx.seq}`, tx };
  };

  const runStep = () => {
    let shouldStop = false;
    setState((previous) => {
      const next = selectiveRepeat({
        ...previous,
        packets: previous.packets.map((packet) => ({ ...packet })),
        nakQueue: [...previous.nakQueue],
        forceDataLoss: lossFrame,
        forceAckLoss: lossAck,
      });
      const logs = next.events ?? [];
      setCurrentLog(logs);
      setTimeline((old) => [...logs, ...old].slice(0, MAX_LOGS));
      setAnimation(buildAnimation(next.lastTransmission));
      pushToasts(next.lastTransmission, logs);
      setLossFrame(false);
      setLossAck(false);
      shouldStop = next.base >= totalPackets && next.nextSeq >= totalPackets;
      return { ...next, forceDataLoss: false, forceAckLoss: false };
    });
    if (shouldStop) setRunning(false);
  };

  const onTick = useEffectEvent(() => {
    runStep();
  });

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return undefined;
    }
    timerRef.current = setInterval(() => onTick(), TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (!animation) return undefined;
    const timeout = setTimeout(() => setAnimation(null), ANIM_MS);
    return () => clearTimeout(timeout);
  }, [animation]);

  const resetView = (nextWindow, nextTotal) => {
    setRunning(false);
    setLossFrame(false);
    setLossAck(false);
    setCurrentLog([]);
    setTimeline([]);
    setAnimation(null);
    lastToastRef.current = "";
    setState(buildState(nextWindow, nextTotal ?? totalPackets));
  };

  const handlePacketCountChange = (value) => {
    if (running) return;
    const nextTotal = Math.max(1, Math.min(60, Number(value) || 1));
    const nextWindow = Math.min(windowSize, nextTotal);
    setTotalPackets(nextTotal);
    setWindowSize(nextWindow);
    resetView(nextWindow, nextTotal);
  };

  const active = animation?.tx;
  const frameTone = active?.dataLost
    ? "danger"
    : active?.type === "retransmission"
      ? "warning"
      : "info";
  const controlTone =
    active?.nakNumber !== null
      ? "purple"
      : active?.ackLost
        ? "danger"
        : "success";

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
              Selective Repeat at a glance
            </h2>
            <p style={{ margin: "0 0 8px", color: "#334155", lineHeight: 1.6 }}>
              Sender can pipeline up to N frames, and the receiver accepts
              out-of-order frames. Lost frames are retransmitted individually
              instead of resending the whole window.
            </p>
            <p
              style={{ margin: "0 0 14px", color: "#334155", lineHeight: 1.6 }}
            >
              Controls: pick window size before starting, then use
              Start/Stop/Reset. Press "Loss Frame" or "Loss ACK" once to drop
              the next frame or ACK.
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
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(148,163,184,0.3)",
              boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "#7c3aed",
              }}
            >
              Sliding Window Simulation
            </p>
            <h1 style={{ margin: "0 0 10px", fontSize: 42, lineHeight: 1.1 }}>
              Selective Repeat Protocol
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.7,
                color: "#334155",
              }}
            >
              This version follows your reference example: out-of-order frames
              are buffered, the receiver issues a NAK for the missing frame, and
              the sender retransmits only that missing frame.
            </p>
          </div>
          <div
            style={{
              padding: 24,
              borderRadius: 24,
              background: "linear-gradient(135deg, #4c1d95 0%, #312e81 100%)",
              color: "#fff",
              boxShadow: "0 24px 60px rgba(49,46,129,0.24)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                textTransform: "uppercase",
                opacity: 0.78,
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
                    "linear-gradient(90deg, #22c55e 0%, #a855f7 100%)",
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
                ["Buffered", stats.buffered],
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
                  <div style={{ fontSize: 12, opacity: 0.72 }}>{label}</div>
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
            background: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(148,163,184,0.28)",
            boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
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
              Total Frames
              <input
                type="number"
                min={1}
                max={60}
                value={totalPackets}
                disabled={running}
                onChange={(event) => handlePacketCountChange(event.target.value)}
                style={{
                  width: 120,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.45)",
                  background: "#fff",
                }}
              />
            </label>
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
                max={totalPackets}
                value={windowSize}
                disabled={running}
                onChange={(event) => {
                  if (running) return;
                  const nextWindow = Math.max(
                    1,
                    Math.min(totalPackets, Number(event.target.value) || 1),
                  );
                  setWindowSize(nextWindow);
                  resetView(nextWindow);
                }}
                style={{
                  width: 120,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.45)",
                  background: "#fff",
                }}
              />
            </label>
            <button
              onClick={() => {
                if (!complete) {
                  setRunning(true);
                  runStep();
                }
              }}
              disabled={running || complete}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                color: "#fff",
                fontWeight: 800,
                cursor: running || complete ? "not-allowed" : "pointer",
                opacity: running || complete ? 0.45 : 1,
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              }}
            >
              Start
            </button>
            <button
              onClick={() => setRunning(false)}
              disabled={!running}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                color: "#fff",
                fontWeight: 800,
                cursor: !running ? "not-allowed" : "pointer",
                opacity: !running ? 0.45 : 1,
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              }}
            >
              Stop
            </button>
            <button
              onClick={() => resetView(windowSize)}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
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
                color: "#fff",
                fontWeight: 800,
                cursor: !running || lossFrame ? "not-allowed" : "pointer",
                opacity: !running || lossFrame ? 0.45 : 1,
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
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
                color: "#fff",
                fontWeight: 800,
                cursor: !running || lossAck ? "not-allowed" : "pointer",
                opacity: !running || lossAck ? 0.45 : 1,
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
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
            background: "linear-gradient(145deg, #312e81 0%, #1e1b4b 100%)",
            color: "#e2e8f0",
            border: "1px solid rgba(148,163,184,0.18)",
            boxShadow: "0 28px 60px rgba(30,27,75,0.24)",
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
            <h2 style={{ margin: 0, fontSize: 24 }}>Selective Repeat Flow</h2>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                fontSize: 13,
              }}
            >
              <span>Sf: {state.base}</span>
              <span>Sn: {state.nextSeq}</span>
              <span>Rn: {state.receiverBase}</span>
            </div>
          </div>
          <div style={{ position: "relative", minHeight: 280 }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 28,
                width: 180,
                padding: 20,
                borderRadius: 20,
                background: "rgba(59,130,246,0.18)",
                border: "1px solid rgba(96,165,250,0.35)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800 }}>Sender</div>
              <div style={{ fontSize: 13, opacity: 0.84, marginTop: 6 }}>
                Window [{state.base},{" "}
                {Math.min(state.base + state.windowSize - 1, totalPackets - 1)}]
              </div>
              <div style={{ fontSize: 13, opacity: 0.84, marginTop: 4 }}>
                Sf = {state.base}, Sn = {state.nextSeq}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 28,
                width: 180,
                padding: 20,
                borderRadius: 20,
                background: "rgba(168,85,247,0.18)",
                border: "1px solid rgba(196,181,253,0.35)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800 }}>Receiver</div>
              <div style={{ fontSize: 13, opacity: 0.84, marginTop: 6 }}>
                Window [{state.receiverBase},{" "}
                {Math.min(
                  state.receiverBase + state.windowSize - 1,
                  totalPackets - 1,
                )}]
              </div>
              <div style={{ fontSize: 13, opacity: 0.84, marginTop: 4 }}>
                Rn = {state.receiverBase}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: 190,
                right: 190,
                top: 56,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(56,189,248,0.4), rgba(34,197,94,0.4))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 190,
                right: 190,
                top: 156,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(245,158,11,0.35), rgba(168,85,247,0.5))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 220,
                top: 28,
                fontSize: 12,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.7)",
              }}
            >
              Frames
            </div>
            <div
              style={{
                position: "absolute",
                left: 220,
                top: 128,
                fontSize: 12,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "rgba(226,232,240,0.7)",
              }}
            >
              ACK / NAK
            </div>

            {active ? (
              <>
                <Badge
                  label={`F${active.seq}`}
                  tone={frameTone}
                  style={{
                    position: "absolute",
                    top: 28,
                    left: 200,
                    animation: `srFrameTravel ${ANIM_MS}ms ease-in-out forwards`,
                  }}
                />
                {!active.dataLost &&
                (active.ackNumber !== null || active.nakNumber !== null) ? (
                  <Badge
                    label={
                      active.nakNumber !== null
                        ? `NAK ${active.nakNumber}`
                        : `ACK ${active.ackNumber}`
                    }
                    tone={controlTone}
                    style={{
                      position: "absolute",
                      top: 128,
                      right: 200,
                      animation: `srControlTravel ${ANIM_MS}ms ease-in-out forwards`,
                    }}
                  />
                ) : null}
              </>
            ) : null}

            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
            @keyframes srFrameTravel {
              0% { transform: translateX(0) scale(0.92); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translateX(calc(100vw - 820px)) scale(1); opacity: 1; }
            }
            @keyframes srControlTravel {
              0% { transform: translateX(0) scale(0.92); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translateX(calc(-100vw + 820px)) scale(1); opacity: 1; }
            }
          `}</style>
        </div>

        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns:
              "minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(300px, 0.9fr)",
            alignItems: "start",
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(148,163,184,0.28)",
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
              {state.packets.map((packet) => (
                <FrameCard
                  key={`sender-${packet.seq}`}
                  title={`F${packet.seq}`}
                  styleTuple={senderStyles[senderStatus(packet)]}
                  packetLabel={`Retry: ${packet.retryCount}`}
                  highlight={
                    packet.seq >= state.base &&
                    packet.seq < state.base + state.windowSize &&
                    !packet.ackReceived
                  }
                />
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(148,163,184,0.28)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 20 }}>
              Receiver Frames
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
                gap: 12,
              }}
            >
              {state.packets.map((packet) => (
                <FrameCard
                  key={`receiver-${packet.seq}`}
                  title={`R${packet.seq}`}
                  styleTuple={receiverStyles[receiverStatus(packet, state)]}
                  highlight={packet.seq === state.receiverBase}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 22,
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(148,163,184,0.28)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 20 }}>
              Event Order
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {timeline.length > 0 ? (
                timeline.map((entry, index) => (
                  <div
                    key={`${entry}-${index}`}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: index === 0 ? "#f3e8ff" : "#f8fafc",
                      border: "1px solid rgba(148,163,184,0.22)",
                      color: "#0f172a",
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {entry}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "#f8fafc",
                    border: "1px solid rgba(148,163,184,0.22)",
                    color: "#475569",
                  }}
                >
                  Transmission events will appear here in the order they happen.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
