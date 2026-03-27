export default function Packet({ packet, inWindow }) {
  let color = "#e0e0e0";
  let statusText = "Pending";
  let glowColor = "transparent";

  if (packet.status === "sent") {
    color = "#2196F3";
    statusText = "Sent";
    glowColor = "rgba(33, 150, 243, 0.4)";
  }
  if (packet.status === "ack") {
    color = "#4CAF50";
    statusText = "ACK";
    glowColor = "rgba(76, 175, 80, 0.4)";
  }
  if (packet.status === "lost") {
    color = "#F44336";
    statusText = "Lost";
    glowColor = "rgba(244, 67, 54, 0.6)";
  }
  if (packet.status === "ack-lost") {
    color = "#EAB308";
    statusText = "ACK Lost";
    glowColor = "rgba(234, 179, 8, 0.6)";
  }
  if (packet.status === "retrying") {
    color = "#FF9800";
    statusText = "Retry";
    glowColor = "rgba(255, 152, 0, 0.8)";
  }

  return (
    <div
      style={{
        width: 70,
        height: 70,
        background: color,
        border: inWindow
          ? "3px solid white"
          : "2px solid rgba(255,255,255,0.5)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 700,
        fontSize: 20,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: inWindow
          ? `0 0 20px ${glowColor}, 0 8px 16px rgba(0,0,0,0.25)`
          : `0 4px 8px rgba(0,0,0,0.2)`,
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
            border: "2px solid rgba(255,255,255,0.6)",
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
