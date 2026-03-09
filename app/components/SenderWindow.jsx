import Packet from "./Packet";

export default function SenderWindow({ packets, base, windowSize }) {

  return (
    <div style={{ display: "flex", gap: 10 }}>

      {packets.map((packet, i) => {

        const inWindow = i >= base && i < base + windowSize;

        return (
          <Packet
            key={i}
            packet={packet}
            inWindow={inWindow}
          />
        );
      })}

    </div>
  );
}