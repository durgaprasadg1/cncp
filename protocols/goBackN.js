export function goBackN(state) {
  let { base, nextSeq, windowSize, packets, lossRate } = state;

  if (nextSeq < base + windowSize && nextSeq < packets.length) {

    const lost = Math.random() < lossRate;

    if (lost) {
      packets[nextSeq].status = "lost";
      nextSeq = base;
    } else {
      packets[nextSeq].status = "sent";
      packets[nextSeq].ack = true;
      nextSeq++;
    }
  }

  while (base < packets.length && packets[base].ack) {
    packets[base].status = "ack";
    base++;
  }

  return {
    ...state,
    base,
    nextSeq,
    packets
  };
}