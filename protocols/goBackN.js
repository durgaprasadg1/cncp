export function goBackN(state) {
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
    baseTimer,
    receiverExpected,
  } = state;

  const maxPackets = packets.length;
  const timeoutLimit = timeoutSteps ?? 6;
  const events = [];

  let timer = baseTimer ?? 0;
  let receiverNext = receiverExpected ?? 0;

  const log = (message) => {
    events.push(message);
  };

  const result = {
    type: "idle",
    seq: null,
    ackNumber: null,
    dataLost: false,
    ackLost: false,
    receiverAction: null,
    timeout: false,
    resendRange: null,
    resentPackets: [],
  };

  if (base < nextSeq) {
    timer += 1;
  } else {
    timer = 0;
  }

  if (base < maxPackets && timer >= timeoutLimit && base < nextSeq) {
    result.timeout = true;
    result.resendRange = [base, Math.min(nextSeq - 1, maxPackets - 1)];
    result.resentPackets = packets
      .slice(base, nextSeq)
      .filter((packet) => !packet.ackReceived)
      .map((packet) => packet.seq);

    log(
      `Timeout at sender base F${base}. Go-Back-N resends frames F${result.resendRange[0]} to F${result.resendRange[1]}.`,
    );

    for (let index = base; index < Math.min(nextSeq, maxPackets); index += 1) {
      const packet = packets[index];
      if (!packet.ackReceived) {
        packet.status = "retrying";
        packet.retryCount += 1;
        packet.timeout = 0;
      }
    }

    nextSeq = base;
    timer = 0;
  }

  if (nextSeq < maxPackets && nextSeq < base + windowSize) {
    const packet = packets[nextSeq];
    const dataLost = forceDataLoss ? true : Math.random() < dataLossRate;

    result.type = packet.retryCount > 0 ? "retransmission" : "send";
    result.seq = nextSeq;
    result.dataLost = dataLost;

    packet.timeout = 0;
    packet.sentTime = Date.now();

    if (packet.retryCount > 0) {
      log(`Retransmitting F${nextSeq} from sender window.`);
    } else {
      log(`Sending F${nextSeq} from sender to receiver.`);
    }

    if (dataLost) {
      packet.status = "lost";
      packet.received = false;
      result.receiverAction = "lost";
      log(`Frame F${nextSeq} was lost in the channel.`);
      nextSeq += 1;
    } else {
      const isDuplicate = nextSeq < receiverNext;
      const isInOrder = nextSeq === receiverNext;

      if (isInOrder) {
        packet.received = true;
        packet.status = "sent";
        receiverNext += 1;
        result.receiverAction = "accepted";
        log(`Receiver accepted F${nextSeq}.`);
      } else if (isDuplicate) {
        packet.received = true;
        packet.status = "retrying";
        result.receiverAction = "duplicate";
        log(`Receiver identified F${nextSeq} as a duplicate frame.`);
      } else {
        packet.received = false;
        packet.status = "sent";
        result.receiverAction = "out-of-order";
        log(
          `Receiver discarded out-of-order F${nextSeq} and still expects F${receiverNext}.`,
        );
      }

      const ackNumber = receiverNext;
      const ackLost = forceAckLoss ? true : Math.random() < ackLossRate;

      result.ackNumber = ackNumber;
      result.ackLost = ackLost;

      if (ackLost) {
        packet.status = "ack-lost";
        packet.ackLostCount += 1;
        log(`Cumulative ACK ${ackNumber} was lost on the way back.`);
      } else {
        for (let index = base; index < ackNumber; index += 1) {
          packets[index].ackReceived = true;
          packets[index].status = "ack";
        }
        log(`Sender received cumulative ACK ${ackNumber}.`);
      }

      nextSeq += 1;
    }
  } else if (!result.timeout) {
    if (base >= maxPackets) {
      log("All frames have been acknowledged.");
    } else {
      log(
        `Sender window is full. Waiting for ACK of F${base} before sending more frames.`,
      );
    }
  }

  while (base < maxPackets && packets[base].ackReceived) {
    base += 1;
  }

  if (base >= nextSeq) {
    timer = 0;
  }

  return {
    ...state,
    base,
    nextSeq,
    packets,
    baseTimer: timer,
    receiverExpected: receiverNext,
    events,
    lastTransmission: result,
  };
}
