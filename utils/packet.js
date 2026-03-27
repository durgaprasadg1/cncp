export function createPackets(count) {
  const packets = [];
  for (let i = 0; i < count; i++) {
    packets.push({
      seq: i,
      status: "pending",
      ackReceived: false,
      received: false,
      ackLostCount: 0,
      sentTime: null,
      timeout: 0,
      retryCount: 0,
      isRetrying: false,
    });
  }
  return packets;
}
