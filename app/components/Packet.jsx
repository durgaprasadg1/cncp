export default function Packet({ packet, inWindow }) {

  let color = "#ccc";

  if (packet.status === "sent") color = "blue";
  if (packet.status === "ack") color = "green";
  if (packet.status === "lost") color = "red";

  return (
    <div
      style={{
        width: 50,
        height: 50,
        background: color,
        border: inWindow ? "3px solid black" : "1px solid gray",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold"
      }}
    >
      {packet.seq}
    </div>
  );
}