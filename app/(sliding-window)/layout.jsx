export default function SlidingWindowLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "30px 20px",
        color: "#0f172a",
      }}
    >
      {children}
    </div>
  );
}
