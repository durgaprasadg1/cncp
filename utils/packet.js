export function createPackets(count) {
  const packets = [];
  for (let i = 0; i < count; i++) {
    packets.push({
      seq: i,
      status: "pending",
      ack: false
    });
  }
  return packets;
}