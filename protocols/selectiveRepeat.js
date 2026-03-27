export function selectiveRepeat(state) {
  let { base, nextSeq, windowSize, packets, lossRate } = state;

  // Try to send next packet if within window
  if (nextSeq < packets.length && nextSeq < base + windowSize) {
    const lost = Math.random() < lossRate;

    if (lost) {
      packets[nextSeq].status = "lost";
      // In Selective Repeat, only this packet is retried, not all
    } else {
      packets[nextSeq].status = "sent";
      packets[nextSeq].ack = true;
    }

    nextSeq++;
  }

  // Move base window forward when all consecutive packets from base are acknowledged
  while (base < packets.length && packets[base] && packets[base].ack && packets[base].status === "sent") {
    packets[base].status = "ack";
    base++;
  }

  // For any lost packets, retry them individually
  for (let i = base; i < nextSeq && i < packets.length; i++) {
    if (packets[i].status === "lost") {
      const lost = Math.random() < lossRate;
      if (!lost) {
        packets[i].status = "sent";
        packets[i].ack = true;
      }
      // If still lost, keep the status as lost for next retry
    }
  }

  return {
    ...state,
    base,
    nextSeq,
    packets
  };
}