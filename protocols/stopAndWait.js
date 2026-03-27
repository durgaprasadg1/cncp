export function stopAndWait(state) {
  let { current, packets, lossRate } = state;

  if (current >= packets.length) return state;

  // Check if current packet needs to be sent or retried
  const currentPacket = packets[current];
  
  // Handle timeout - retransmit after 10 steps without ACK
  if ((currentPacket.status === "sent" || currentPacket.status === "lost")) {
    currentPacket.timeout++;
    
    // Timeout trigger: resend after 10 steps
    if (currentPacket.timeout >= 10) {
      currentPacket.isRetrying = true;
      currentPacket.retryCount++;
      currentPacket.timeout = 0;
      currentPacket.status = "retrying";
      
      // Attempt to resend
      const lost = Math.random() < lossRate;
      if (lost) {
        currentPacket.status = "lost";
      } else {
        currentPacket.status = "ack";
        currentPacket.isRetrying = false;
        current++;
      }
    }
  } else if (currentPacket.status === "pending" || currentPacket.status === "retrying") {
    const lost = Math.random() < lossRate;

    if (lost) {
      currentPacket.status = "lost";
      currentPacket.sentTime = Date.now();
      currentPacket.timeout = 0;
    } else {
      currentPacket.status = "sent";
      currentPacket.sentTime = Date.now();
      currentPacket.timeout = 0;
    }
  } else if (currentPacket.status === "ack" && current < packets.length - 1) {
    // Already acked, move to next
    current++;
  }

  return {
    ...state,
    packets,
    current
  };
}