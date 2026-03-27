export function goBackN(state) {
  let {
    base,
    nextSeq,
    windowSize,
    packets,
    dataLossRate,
    ackLossRate,
    timeoutSteps,
    baseTimer,
    receiverExpected,
  } = state;

  const maxPackets = packets.length;
  const timeoutLimit = timeoutSteps ?? 6;
  let timer = baseTimer ?? 0;
  let receiverNext = receiverExpected ?? 0;

  if (base < nextSeq) {
    timer += 1;
  } else {
    timer = 0;
  }

  if (base < maxPackets && timer >= timeoutLimit) {
    for (let i = base; i < Math.min(nextSeq, maxPackets); i++) {
      if (!packets[i].ackReceived) {
        packets[i].status = "retrying";
        packets[i].retryCount += 1;
        packets[i].timeout = 0;
      }
    }
    nextSeq = base;
    timer = 0;
  }

  if (nextSeq < maxPackets && nextSeq < base + windowSize) {
    const packet = packets[nextSeq];
    const dataLost = Math.random() < dataLossRate;

    packet.timeout = 0;

    if (dataLost) {
      packet.status = "lost";
      packet.received = false;
    } else {
      const isDuplicate = nextSeq < receiverNext;
      const isInOrder = nextSeq === receiverNext;

      if (isInOrder) {
        packet.received = true;
        packet.status = "sent";
        receiverNext += 1;
      } else if (isDuplicate) {
        packet.received = true;
        packet.status = "retrying";
      } else {
        packet.received = false;
        packet.status = "sent";
      }

      if (isInOrder || isDuplicate) {
        const ackLost = Math.random() < ackLossRate;
        if (ackLost) {
          packet.status = "ack-lost";
          packet.ackLostCount += 1;
        } else {
          for (let i = base; i < receiverNext; i++) {
            packets[i].ackReceived = true;
            packets[i].status = "ack";
          }
        }
      }
    }

    nextSeq += 1;
  }

  while (base < maxPackets && packets[base].ackReceived) {
    base += 1;
  }

  return {
    ...state,
    base,
    nextSeq,
    packets,
    baseTimer: timer,
    receiverExpected: receiverNext,
  };
}
