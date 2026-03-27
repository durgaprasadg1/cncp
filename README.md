# Sliding Window Protocols Simulation 🌐

An interactive, educational visualization tool for understanding three fundamental sliding window protocols used in computer networking:
- **Stop-and-Wait Protocol**
- **Go-Back-N Protocol**
- **Selective Repeat Protocol**

## 🎯 Features

✅ **Real-time Automatic Simulation** - Simulations run automatically and show all characteristics without failure
✅ **Beautiful Interactive UI** - Color-coded packets and visual window representation
✅ **Live Statistics** - Track packets sent, acknowledged, lost, and completion percentage
✅ **Protocol Comparison** - Run all three protocols to understand their differences
✅ **Configurable Parameters** - Adjust window size and loss rate
✅ **Educational Insights** - Detailed explanation of each protocol's characteristics
✅ **Retransmission Visualization** - See how each protocol handles packet loss differently

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the simulation.

### Production Build
```bash
npm run build
npm start
```

## 📚 How to Use

1. **Navigate to Home**: Landing page with all three protocol options
2. **Select a Protocol**: Choose from Stop-and-Wait, Go-Back-N, or Selective Repeat
3. **Start Simulation**: Click "Start" button to begin automatic packet transmission
4. **Observe**: Watch packets being sent, acknowledged, or lost in real-time
5. **Monitor Statistics**: Check status panel for real-time metrics
6. **Control**: Use Stop and Reset buttons to pause or restart

## 🎨 Visual Guide

### Packet Colors
- 🟫 **Gray** - Pending (not sent yet)
- 🟦 **Blue** - Sent (in transit)
- 🟩 **Green** - Acknowledged (successfully received)
- 🟥 **Red** - Lost (dropped by network)

### Packet Borders
- **Bold Black Border** - Packet is within the send window
- **Thin Gray Border** - Packet is outside the window

## 🔧 Project Structure

```
cncp/
├── app/
│   ├── (sliding-window)/
│   │   ├── GoBackN/page.jsx           # Go-Back-N simulation
│   │   ├── Selective-Repeat/page.jsx  # Selective Repeat simulation
│   │   └── stop-and-wait/page.jsx     # Stop-and-Wait simulation
│   ├── components/
│   │   ├── ControlPanel.jsx           # Control buttons component
│   │   ├── Packet.jsx                 # Individual packet display
│   │   └── SenderWindow.jsx           # Window display component
│   ├── layout.jsx                     # Root layout
│   └── page.jsx                       # Home page with protocol selection
├── protocols/
│   ├── goBackN.js                     # Go-Back-N algorithm
│   ├── selectiveRepeat.js             # Selective Repeat algorithm
│   └── stopAndWait.js                 # Stop-and-Wait algorithm
├── utils/
│   └── packet.js                      # Packet creation utility
└── SIMULATION_GUIDE.md                # Detailed protocol documentation
```

## 🧠 Protocol Comparison

| Feature | Stop-and-Wait | Go-Back-N | Selective Repeat |
|---------|---------------|-----------|-----------------|
| Window Size | 1 | N | N |
| Sending Style | Sequential | Pipelined | Pipelined |
| ACK Type | Individual | Cumulative | Individual |
| Loss Handling | Resend 1 packet | Resend all from loss point | Resend only lost packet |
| Efficiency | ⭐☆☆☆☆ | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐⭐ |
| Complexity | ⭐☆☆☆☆ | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ |

## 📊 Simulation Parameters

### Window Size (Default: 4)
- Controls how many packets can be sent before waiting for ACKs
- Larger window = better throughput but more retransmission on loss
- Smaller window = simpler but less efficient

### Loss Rate (Default: 15%)
- Probability (0-1) that a packet will be lost
- 0% = no packet loss (unrealistic)
- 15% = 1 in 7 packets lost (realistic)
- Higher values = more retransmissions

## 🎓 Learning Outcomes

By using this simulation, you'll understand:
- How sliding window protocols work
- Trade-offs between simplicity and efficiency
- Impact of window size on performance
- Effects of packet loss on throughput
- Differences between cumulative and individual ACKs
- Why TCP uses Selective Repeat approach

## 💡 Key Insights

### Stop-and-Wait
- Severely limited by round-trip time (RTT)
- Good only for very reliable, short-distance links
- Modern networks would have terrible performance

### Go-Back-N
- Better than Stop-and-Wait but wastes bandwidth on retransmission
- All unacked packets resent when one packet is lost
- Used in some legacy systems

### Selective Repeat
- Most efficient - only retransmits lost packets
- Modern protocols (TCP with SACK) use this approach
- Requires more complex buffer management

## 📖 For More Information

See [SIMULATION_GUIDE.md](./SIMULATION_GUIDE.md) for:
- Detailed protocol descriptions
- Real-world applications
- Bandwidth efficiency calculations
- Learning resources

## 🛠 Tech Stack

- **Next.js 16.1** - React framework
- **React 19.2** - UI framework
- **CSS-in-JS** - Inline styles for components
- **JavaScript ES6+** - Protocol implementations

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

Feel free to fork and improve:
- Add more protocols (e.g., SACK TCP)
- Enhance visualizations
- Add more statistics
- Improve UI/UX

## 🐛 Troubleshooting

**Simulation not starting?**
- Click "Reset" first, then "Start"
- Ensure JavaScript is enabled

**Packets moving too fast/slow?**
- Edit the interval timing in protocol page files (default: 500ms)

**All packets always succeed?**
- Increase the loss rate value
- Click "Reset" to randomize again

---

**Enjoy learning networking protocols!** 🚀
