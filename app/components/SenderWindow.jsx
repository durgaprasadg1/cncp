import Packet from "./Packet";

export default function SenderWindow({ packets, base, windowSize, isDark = true }) {
  const bgColor = isDark ? "rgba(26, 31, 58, 0.8)" : "rgba(232, 241, 246, 0.8)";
  const borderColor = isDark ? "rgba(0, 212, 255, 0.4)" : "rgba(2, 132, 199, 0.4)";
  const accentColor = isDark ? "#00d4ff" : "#0284c7";
  const textColor = isDark ? "#f0f5ff" : "#1a1f3a";
  const infoBoxBg = isDark ? "rgba(0, 212, 255, 0.05)" : "rgba(2, 132, 199, 0.05)";
  const infoBoxBorder = isDark ? "rgba(0, 212, 255, 0.2)" : "rgba(2, 132, 199, 0.2)";
  const shadowColor = isDark ? "rgba(0, 212, 255, 0.2)" : "rgba(2, 132, 199, 0.15)";

  return (
    <div style={{ 
      padding: "28px", 
      background: bgColor, 
      borderRadius: 16,
      border: `2px solid ${borderColor}`,
      overflow: "auto",
      backdropFilter: "blur(10px)",
      boxShadow: `0 0 30px ${shadowColor}, inset 0 1px 1px ${infoBoxBorder}`
    }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {packets.map((packet, i) => {

          const inWindow = i >= base && i < base + windowSize;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: inWindow ? 1 : 0.6,
                transition: "all 0.3s ease"
              }}
            >
              <Packet
                packet={packet}
                inWindow={inWindow}
                isDark={isDark}
              />
              <span style={{ 
                fontSize: 12, 
                marginTop: 8, 
                color: accentColor,
                fontWeight: 600,
                opacity: 0.9
              }}>
                #{i}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ 
        marginTop: 24, 
        fontSize: 14, 
        color: textColor,
        padding: "16px 12px",
        background: infoBoxBg,
        borderRadius: 8,
        backdropFilter: "blur(5px)",
        border: `1px solid ${infoBoxBorder}`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: accentColor }}>Window:</strong> [{base}, {Math.min(base + windowSize - 1, packets.length - 1)}]
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: accentColor }}>Total:</strong> {packets.length} | 
            <strong style={{ color: isDark ? "#00f0ff" : "#0ea5e9", marginLeft: 8 }} > ✓ {packets.filter(p => p.status === "ack").length}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}