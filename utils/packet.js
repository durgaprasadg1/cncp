export function createPackets(count) {
  const packets = [];
  for (let i = 0; i < count; i++) {
    packets.push({
      seq: i,
      status: "pending",
      ack: false,
      sentTime: null,
      timeout: 0,
      retryCount: 0,
      isRetrying: false
    });
  }
  return packets;
}