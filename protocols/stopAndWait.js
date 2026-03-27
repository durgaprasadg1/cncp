export function stopAndWait(state) {
  let { current, packets, dataLossRate, ackLossRate, timeoutSteps } = state;

  if (current >= packets.length) return state;

  const currentPacket = packets[current];
  const timeoutLimit = timeoutSteps ?? 8;

  const attemptSend = () => {
    const dataLost = Math.random() < dataLossRate;
    currentPacket.timeout = 0;

    if (dataLost) {
      currentPacket.status = "lost";
      currentPacket.received = false;
      return;
    }

    currentPacket.status = "sent";
    currentPacket.received = true;

    const ackLost = Math.random() < ackLossRate;
    if (ackLost) {
      currentPacket.status = "ack-lost";
      currentPacket.ackLostCount += 1;
      return;
    }

    currentPacket.status = "ack";
    currentPacket.ackReceived = true;
    current += 1;
  };

  if (currentPacket.ackReceived) {
    current += 1;
  } else if (currentPacket.status === "pending") {
    attemptSend();
  } else if (currentPacket.status === "retrying") {
    attemptSend();
  } else if (
    currentPacket.status === "sent" ||
    currentPacket.status === "lost" ||
    currentPacket.status === "ack-lost"
  ) {
    currentPacket.timeout += 1;
    if (currentPacket.timeout >= timeoutLimit) {
      currentPacket.isRetrying = true;
      currentPacket.retryCount += 1;
      currentPacket.status = "retrying";
    }
  }

  return {
    ...state,
    packets,
    current,
  };
}
