function ensureReceiverFields(packet) {
  if (typeof packet.receiverBuffered !== "boolean") {
    packet.receiverBuffered = false;
  }
  if (typeof packet.receiverDelivered !== "boolean") {
    packet.receiverDelivered = false;
  }
  if (typeof packet.nakCount !== "number") {
    packet.nakCount = 0;
  }
}

export function selectiveRepeat(state) {
  let {
    base,
    nextSeq,
    windowSize,
    packets,
    dataLossRate,
    ackLossRate,
    forceDataLoss,
    forceAckLoss,
    timeoutSteps,
    receiverBase,
    nakQueue,
    pendingNak,
  } = state;

  const maxPackets = packets.length;
  const timeoutLimit = timeoutSteps ?? 6;
  const events = [];
  let receiverNext = receiverBase ?? 0;
  let activeNak = pendingNak ?? null;
  let queuedNaks = [...(nakQueue ?? [])];

  for (const packet of packets) {
    ensureReceiverFields(packet);
  }

  const log = (message) => {
    events.push(message);
  };

  const result = {
    type: "idle",
    seq: null,
    dataLost: false,
    receiverAction: null,
    ackNumber: null,
    ackLost: false,
    nakNumber: null,
    resendReason: null,
    deliveredFrames: [],
  };

  for (let index = base; index < Math.min(base + windowSize, maxPackets); index += 1) {
    const packet = packets[index];
    if (packet.ackReceived) continue;

    if (
      packet.status === "sent" ||
      packet.status === "ack-lost" ||
      packet.status === "lost" ||
      packet.status === "retrying"
    ) {
      packet.timeout += 1;
    }
  }

  let seqToSend = null;
  let sendMode = "new";

  if (
    activeNak !== null &&
    activeNak >= base &&
    activeNak < maxPackets &&
    !packets[activeNak].ackReceived
  ) {
    seqToSend = activeNak;
    sendMode = "nak";
    activeNak = null;
  } else {
    activeNak = null;
  }

  if (seqToSend === null) {
    for (
      let index = base;
      index < Math.min(base + windowSize, maxPackets);
      index += 1
    ) {
      const packet = packets[index];
      if (!packet.ackReceived && packet.timeout >= timeoutLimit) {
        seqToSend = index;
        sendMode = "timeout";
        break;
      }
    }
  }

  if (
    seqToSend === null &&
    nextSeq < maxPackets &&
    nextSeq < base + windowSize
  ) {
    seqToSend = nextSeq;
    sendMode = "new";
  }

  if (seqToSend === null) {
    if (base >= maxPackets) {
      log("All frames have been selectively acknowledged.");
    } else {
      log(
        `Sender window is full. Waiting for ACK/NAK feedback for frames starting at F${base}.`,
      );
    }

    return {
      ...state,
      base,
      nextSeq,
      packets,
      receiverBase: receiverNext,
      nakQueue: queuedNaks,
      pendingNak: activeNak,
      events,
      lastTransmission: result,
    };
  }

  const packet = packets[seqToSend];
  const dataLost = forceDataLoss ? true : Math.random() < dataLossRate;

  packet.timeout = 0;
  packet.sentTime = Date.now();
  packet.status = sendMode === "new" ? "sent" : "retrying";
  result.seq = seqToSend;
  result.type = sendMode === "new" ? "send" : "retransmission";
  result.dataLost = dataLost;
  result.resendReason = sendMode === "nak" ? "NAK" : sendMode === "timeout" ? "timeout" : null;

  if (sendMode === "new") {
    log(`Sending frame F${seqToSend} from the sender window.`);
  } else if (sendMode === "nak") {
    packet.retryCount += 1;
    packet.status = "retrying";
    log(`Sender received NAK-${seqToSend} and selectively retransmits F${seqToSend}.`);
  } else {
    packet.retryCount += 1;
    packet.status = "retrying";
    log(`Timeout for F${seqToSend}. Sender retransmits only that frame.`);
  }

  if (dataLost) {
    packet.status = "lost";
    result.receiverAction = "lost";
    log(`Frame F${seqToSend} was lost during transmission.`);

    if (sendMode === "new" && seqToSend === nextSeq) {
      nextSeq += 1;
    }

    return {
      ...state,
      base,
      nextSeq,
      packets,
      receiverBase: receiverNext,
      nakQueue: queuedNaks,
      pendingNak: activeNak,
      events,
      lastTransmission: result,
    };
  }

  if (sendMode === "new" && seqToSend === nextSeq) {
    nextSeq += 1;
  }

  const isOldFrame = seqToSend < receiverNext;
  const isInReceiverWindow =
    seqToSend >= receiverNext && seqToSend < receiverNext + windowSize;

  if (isOldFrame) {
    result.receiverAction = "duplicate";
    log(`Receiver got duplicate F${seqToSend} and sends ACK-${receiverNext}.`);
    result.ackNumber = receiverNext;
  } else if (!isInReceiverWindow) {
    result.receiverAction = "outside-window";
    log(
      `Receiver ignored F${seqToSend} because it is outside receiver window [${receiverNext}, ${Math.min(receiverNext + windowSize - 1, maxPackets - 1)}].`,
    );
  } else if (seqToSend === receiverNext) {
    packet.received = true;
    packet.receiverBuffered = true;
    result.receiverAction = "accepted";

    const deliveredFrames = [];
    while (
      receiverNext < maxPackets &&
      packets[receiverNext].receiverBuffered &&
      !packets[receiverNext].receiverDelivered
    ) {
      packets[receiverNext].receiverDelivered = true;
      packets[receiverNext].received = true;
      deliveredFrames.push(receiverNext);
      receiverNext += 1;
    }

    result.deliveredFrames = deliveredFrames;
    result.ackNumber = receiverNext;

    if (deliveredFrames.length > 1) {
      log(
        `Receiver accepted F${seqToSend} and released buffered frames ${deliveredFrames.map((frame) => `F${frame}`).join(", ")}. ACK-${receiverNext} sent.`,
      );
    } else {
      log(`Receiver accepted F${seqToSend}. ACK-${receiverNext} sent.`);
    }
  } else {
    packet.received = true;
    packet.receiverBuffered = true;
    result.receiverAction = "buffered";
    result.nakNumber = receiverNext;

    if (!queuedNaks.includes(receiverNext)) {
      queuedNaks.push(receiverNext);
    }

    packets[receiverNext].nakCount += 1;
    log(
      `Receiver buffered out-of-order F${seqToSend} and sends NAK-${receiverNext} for the missing frame.`,
    );
  }

  if (result.ackNumber !== null) {
    const ackLost = forceAckLoss ? true : Math.random() < ackLossRate;
    result.ackLost = ackLost;

    if (ackLost) {
      packet.status = "ack-lost";
      packet.ackLostCount += 1;
      log(`ACK-${result.ackNumber} was lost before reaching the sender.`);
    } else {
      for (let index = base; index < result.ackNumber; index += 1) {
        if (packets[index].receiverDelivered) {
          packets[index].ackReceived = true;
          packets[index].status = "ack";
        }
      }
      log(`Sender received ACK-${result.ackNumber}.`);
    }
  }

  if (result.nakNumber !== null) {
    activeNak = result.nakNumber;
    log(`Sender received NAK-${result.nakNumber}.`);
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
    nakQueue: queuedNaks.filter((seq) => seq >= base && seq < maxPackets),
    pendingNak: activeNak,
    events,
    lastTransmission: result,
  };
}
