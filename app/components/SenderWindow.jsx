import Packet from "./Packet";

export default function SenderWindow({ packets, base, windowSize }) {

  return (
    <div  style={{ 
      padding: "28px", 
      background: "black", 
      borderRadius: 16,
      border: "2px solid rgba(255,255,255,0.2)",
      overflow: "auto",
      backdropFilter: "blur(10px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.1)"
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
              />
              <span style={{ 
                fontSize: 12, 
                marginTop: 8, 
                color: "#fff",
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
        color: "rgba(255,255,255,0.9)",
        padding: "16px 12px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        backdropFilter: "blur(5px)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "white" }}>Window:</strong> [{base}, {Math.min(base + windowSize - 1, packets.length - 1)}]
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "white" }}>Total:</strong> {packets.length} | 
            <strong style={{ color: "#4ade80", marginLeft: 8 }} > ✓ {packets.filter(p => p.status === "ack").length}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}