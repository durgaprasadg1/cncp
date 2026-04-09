export default function Packet({ packet, inWindow, isDark = true }) {
  let color = "#7c8fb3";
  let statusText = "Pending";
  let glowColor = "transparent";

  if (packet.status === "sent") {
    color = isDark ? "#00d4ff" : "#0284c7";
    statusText = "Sent";
    glowColor = isDark ? "rgba(0, 212, 255, 0.6)" : "rgba(2, 132, 199, 0.6)";
  }
  if (packet.status === "ack") {
    color = isDark ? "#00f0ff" : "#0ea5e9";
    statusText = "ACK";
    glowColor = isDark ? "rgba(0, 240, 255, 0.6)" : "rgba(14, 165, 233, 0.6)";
  }
  if (packet.status === "lost") {
    color = "#ff1744";
    statusText = "Lost";
    glowColor = "rgba(255, 23, 68, 0.8)";
  }
  if (packet.status === "ack-lost") {
    color = "#ffd60a";
    statusText = "ACK Lost";
    glowColor = "rgba(255, 214, 10, 0.8)";
  }
  if (packet.status === "retrying") {
    color = isDark ? "#a855f7" : "#7c3aed";
    statusText = "Retry";
    glowColor = isDark ? "rgba(168, 85, 247, 0.8)" : "rgba(124, 58, 237, 0.8)";
  }

  return (
    <div
      style={{
        width: 70,
        height: 70,
        background: color,
        border: inWindow
          ? isDark ? "3px solid #f0f5ff" : "3px solid #1a1f3a"
          : isDark ? "2px solid rgba(240, 245, 255, 0.4)" : "2px solid rgba(26, 31, 58, 0.4)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isDark ? "#0a0e27" : "#ffffff",
        fontWeight: 700,
        fontSize: 20,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: inWindow
          ? `0 0 25px ${glowColor}, 0 8px 16px rgba(0,0,0,0.4)`
          : `0 4px 8px rgba(0,0,0,0.3)`,
        position: "relative",
        cursor: "pointer",
        transform: inWindow ? "scale(1.1)" : "scale(1)",
        animation:
          packet.status === "sent"
            ? "packet-send 1s ease-in-out infinite"
            : packet.status === "retrying"
              ? "packet-retry 0.5s ease-in-out infinite"
              : packet.status === "lost"
                ? "packet-shake 0.3s ease-in-out infinite"
                : "none",
      }}
      title={`Packet ${packet.seq}: ${statusText}${packet.retryCount > 0 ? ` (Retry #${packet.retryCount})` : ""}`}
    >
      {packet.seq}

      {/* Pulse effect for sent packets */}
      {packet.status === "sent" && (
        <div
          style={{
            position: "absolute",
            inset: -8,
            border: isDark ? "2px solid rgba(0, 212, 255, 0.8)" : "2px solid rgba(2, 132, 199, 0.8)",
            borderRadius: 8,
            animation: "pulse 2s ease-in-out infinite",
          }}
        ></div>
      )}

      {/* Retry indicator badge */}
      {packet.retryCount > 0 && (
        <div
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            background: "#FF5722",
            color: "white",
            borderRadius: "50%",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 900,
            border: "2px solid white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {packet.retryCount}
        </div>
      )}

      {/* Retrying animation pulse */}
      {packet.status === "retrying" && (
        <div
          style={{
            position: "absolute",
            inset: -6,
            border: "2px solid rgba(255, 152, 0, 0.8)",
            borderRadius: 8,
            animation: "retry-pulse 0.6s ease-in-out infinite",
          }}
        ></div>
      )}
    </div>
  );
}
