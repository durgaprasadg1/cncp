export function goBackN(state) {
  let { base, nextSeq, windowSize, packets, lossRate } = state;

  // Try to send next packet if within window
  if (nextSeq < base + windowSize && nextSeq < packets.length) {
    const lost = Math.random() < lossRate;

    if (lost) {
      packets[nextSeq].status = "lost";
      // On loss, we go back N - reset nextSeq to base for retransmission
      // But keep at least one step of progression to show activity
      if (nextSeq === base) {
        nextSeq = base + 1; // Try next one
      } else {
        nextSeq = base; // Go back to base and retransmit
      }
    } else {
      packets[nextSeq].status = "sent";
      packets[nextSeq].ack = true;
      nextSeq++;
    }
  }

  // Move base window forward when all packets up to base are acknowledged
  while (base < packets.length && packets[base] && packets[base].ack && packets[base].status === "sent") {
    packets[base].status = "ack";
    base++;
  }

  // If we've lost packets before base, need to retransmit them
  let hasLostBeforeNextSeq = false;
  for (let i = base; i < nextSeq && i < packets.length; i++) {
    if (packets[i].status === "lost") {
      hasLostBeforeNextSeq = true;
      nextSeq = base; // Go back N
      break;
    }
  }

  return {
    ...state,
    base,
    nextSeq,
    packets
  };
}