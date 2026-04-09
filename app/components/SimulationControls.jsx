export default function SimulationControls({
  settings,
  onChange,
  onApply,
  showWindowSize,
}) {
  const updateNumber = (key, value, min, max) => {
    const num = Number(value);
    const clamped = Number.isNaN(num) ? min : Math.min(Math.max(num, min), max);
    onChange({ ...settings, [key]: clamped });
  };

  const updatePercent = (key, value) => {
    const num = Number(value);
    const clamped = Number.isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100);
    onChange({ ...settings, [key]: clamped / 100 });
  };

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        border: "1px solid rgba(0, 212, 255, 0.3)",
        background: "rgba(26, 31, 58, 0.8)",
        backdropFilter: "blur(8px)",
        marginBottom: 24,
        boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#00d4ff",
          }}
        >
          Frames
          <input
            type="number"
            min={4}
            max={60}
            value={settings.totalPackets}
            onChange={(e) =>
              updateNumber("totalPackets", e.target.value, 4, 60)
            }
            style={{
              padding: 8,
              borderRadius: 8,
              border: "1px solid rgba(0, 212, 255, 0.5)",
              background: "rgba(0, 212, 255, 0.05)",
              color: "#f0f5ff",
            }}
          />
        </label>

        {showWindowSize && (
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#a855f7",
            }}
          >
            Window Size
            <input
              type="number"
              min={2}
              max={20}
              value={settings.windowSize}
              onChange={(e) =>
                updateNumber("windowSize", e.target.value, 2, 20)
              }
              style={{
                padding: 8,
                borderRadius: 8,
                border: "1px solid rgba(168, 85, 247, 0.5)",
                background: "rgba(168, 85, 247, 0.05)",
                color: "#f0f5ff",
              }}
            />
          </label>
        )}

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#00f0ff",
          }}
        >
          Data Loss ({Math.round(settings.dataLossRate * 100)}%)
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(settings.dataLossRate * 100)}
            onChange={(e) => updatePercent("dataLossRate", e.target.value)}
            style={{
              accentColor: "#00d4ff",
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#a855f7",
          }}
        >
          ACK Loss ({Math.round(settings.ackLossRate * 100)}%)
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(settings.ackLossRate * 100)}
            onChange={(e) => updatePercent("ackLossRate", e.target.value)}
            style={{
              accentColor: "#a855f7",
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#00f0ff",
          }}
        >
          Speed
          <select
            value={settings.tickMs}
            onChange={(e) => updateNumber("tickMs", e.target.value, 200, 2000)}
            style={{
              padding: 8,
              borderRadius: 8,
              border: "1px solid rgba(0, 240, 255, 0.5)",
              background: "rgba(0, 240, 255, 0.05)",
              color: "#f0f5ff",
            }}
          >
            <option value={250}>Very Fast (250ms)</option>
            <option value={400}>Fast (400ms)</option>
            <option value={600}>Normal (600ms)</option>
            <option value={800}>Slow (800ms)</option>
            <option value={1200}>Very Slow (1200ms)</option>
          </select>
        </label>
      </div>

      <div
        style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}
      >
        <button
          onClick={onApply}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)",
            border: "none",
            borderRadius: 10,
            color: "#0a0e27",
            cursor: "pointer",
            fontWeight: 700,
            letterSpacing: 0.4,
            boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
          }}
        >
          Apply Settings
        </button>
        <p style={{ margin: 0, fontSize: 12, color: "#a0aec0" }}>
          Applying settings resets the current simulation.
        </p>
      </div>
    </div>
  );
}
