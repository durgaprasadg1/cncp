"use client";

import { useState, useEffect } from "react";

import SenderWindow from "./components/SenderWindow";
import ControlPanel from "./components/ControlPanel";

import { createPackets } from "../utils/packet";

import { stopAndWait } from "../protocols/stopAndWait";
import { goBackN } from "../protocols/goBackN";
import { selectiveRepeat } from "../protocols/selectiveRepeat";

export default function Page() {

  const totalPackets = 10;

  const [protocol, setProtocol] = useState("stop");

  const [state, setState] = useState({
    packets: [],
    base: 0,
    nextSeq: 0,
    current: 0,
    windowSize: 4,
    lossRate: 0.2
  });

  const [running, setRunning] = useState(false);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      packets: createPackets(totalPackets)
    }));
  }, []);

  function startSimulation() {
    setRunning(true);
  }

  useEffect(() => {

    if (!running) return;

    const interval = setInterval(() => {

      setState((prev) => {

        if (protocol === "stop")
          return stopAndWait(prev);

        if (protocol === "gbn")
          return goBackN(prev);

        if (protocol === "sr")
          return selectiveRepeat(prev);

        return prev;
      });

    }, 1000);

    return () => clearInterval(interval);

  }, [running, protocol]);

  return (
    <div style={{ padding: 40 }}>

      <h1>Sliding Window ARQ Simulator</h1>

      <ControlPanel
        protocol={protocol}
        setProtocol={setProtocol}
        startSimulation={startSimulation}
      />

      <h3>Sender Window</h3>

      <SenderWindow
        packets={state.packets}
        base={state.base}
        windowSize={state.windowSize}
      />

    </div>
  );
}