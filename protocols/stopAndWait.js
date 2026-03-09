export function stopAndWait(state) {
  let { current, packets, lossRate } = state;

  if (current >= packets.length) return state;

  const lost = Math.random() < lossRate;

  if (lost) {
    packets[current].status = "lost";
  } else {
    packets[current].status = "ack";
    current++;
  }

  return {
    ...state,
    packets,
    current
  };
}