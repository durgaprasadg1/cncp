export function selectiveRepeat(state) {
  let { base, nextSeq, windowSize, packets, lossRate } = state;

  if (nextSeq < packets.length && nextSeq < base + windowSize) {

    const lost = Math.random() < lossRate;

    if (lost) {
      packets[nextSeq].status = "lost";
    } else {
      packets[nextSeq].status = "ack";
      packets[nextSeq].ack = true;
    }

    nextSeq++;
  }

  while (base < packets.length && packets[base].ack) {
    base++;
  }

  return {
    ...state,
    base,
    nextSeq,
    packets
  };
}