export default function ControlPanel({
  protocol,
  setProtocol,
  startSimulation
}) {

  return (
    <div style={{ marginBottom: 20 }}>

      <select
        value={protocol}
        onChange={(e) => setProtocol(e.target.value)}
      >

        <option value="stop">Stop and Wait</option>
        <option value="gbn">Go Back N</option>
        <option value="sr">Selective Repeat</option>

      </select>

      <button
        onClick={startSimulation}
        style={{ marginLeft: 20 }}
      >
        Start
      </button>

    </div>
  );
}