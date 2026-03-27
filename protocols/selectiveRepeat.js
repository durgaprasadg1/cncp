export function selectiveRepeat(state) {
  let {
    base,
    nextSeq,
    windowSize,
    packets,
    dataLossRate,
    ackLossRate,
    timeoutSteps,
    receiverBase,
  } = state;

  const maxPackets = packets.length;
  const timeoutLimit = timeoutSteps ?? 6;
  let receiverNext = receiverBase ?? 0;

  let retryIndex = -1;

  for (let i = base; i < Math.min(base + windowSize, maxPackets); i++) {
    const packet = packets[i];
    if (packet.ackReceived) continue;
    if (
      packet.status === "sent" ||
      packet.status === "ack-lost" ||
      packet.status === "lost"
    ) {
      packet.timeout += 1;
    }
    if (packet.timeout >= timeoutLimit && retryIndex === -1) {
      retryIndex = i;
    }
  }

  const attemptSend = (packet, seq) => {
    const dataLost = Math.random() < dataLossRate;
    packet.timeout = 0;

    if (dataLost) {
      packet.status = "lost";
      packet.received = false;
      return;
    }

    const inReceiverWindow =
      seq >= receiverNext && seq < receiverNext + windowSize;
    if (inReceiverWindow) {
      packet.received = true;
      packet.status = "sent";
    } else {
      packet.received = false;
      packet.status = "sent";
      return;
    }

    if (packet.received) {
      const ackLost = Math.random() < ackLossRate;
      if (ackLost) {
        packet.status = "ack-lost";
        packet.ackLostCount += 1;
      } else {
        packet.ackReceived = true;
        packet.status = "ack";
      }
    }
  };

  if (retryIndex !== -1) {
    const packet = packets[retryIndex];
    packet.status = "retrying";
    packet.retryCount += 1;
    attemptSend(packet, retryIndex);
  } else if (nextSeq < maxPackets && nextSeq < base + windowSize) {
    const packet = packets[nextSeq];
    attemptSend(packet, nextSeq);
    nextSeq += 1;
  }

  while (receiverNext < maxPackets && packets[receiverNext].received) {
    receiverNext += 1;
  }

  while (base < maxPackets && packets[base].ackReceived) {
    base += 1;
  }

  return {
    ...state,
    base,
    nextSeq,
    packets,
    receiverBase: receiverNext,
  };
}
