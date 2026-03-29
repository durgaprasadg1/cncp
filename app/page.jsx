"use client";

import Link from "next/link";

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
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 8px" }}>
            Sliding Window Protocols
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "#334155" }}>
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
                border: "1px solid rgba(148, 163, 184, 0.6)",
                background: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
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
                border: "1px solid rgba(148, 163, 184, 0.6)",
                background: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
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
                border: "1px solid rgba(148, 163, 184, 0.6)",
                background: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Selective Repeat
            </button>
          </Link>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>
            About this project
          </h2>
          <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
            This project demonstrates how sliding window protocols send frames,
            handle acknowledgements, and recover from loss. Use the simulations
            to compare reliability and efficiency trade-offs.
          </p>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 28,
          }}
        >
          <h2 style={{ fontSize: 20, margin: "0 0 14px" }}>
            Types of acknowledgements
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {ACK_TYPES.map((ack) => (
              <div
                key={ack.title}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {ack.title}
                </div>
                <div style={{ color: "#334155", lineHeight: 1.6 }}>
                  {ack.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            borderTop: "1px solid rgba(148, 163, 184, 0.35)",
            paddingTop: 16,
            color: "#64748b",
            fontSize: 13,
          }}
        >
          Sliding Window Protocols Simulation
        </footer>
      </div>
    </div>
  );
}
