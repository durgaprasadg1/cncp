# Sliding Window Protocols Simulation Guide

## Overview
This interactive educational tool simulates three fundamental sliding window protocols used in computer networks for reliable data transmission. Each protocol demonstrates different approaches to handling packet loss and acknowledgment.

## Three Protocols Explained

### 1. **Stop-and-Wait Protocol**
**How it works:**
- Sender transmits ONE packet at a time
- Waits for acknowledgment (ACK) from receiver before sending the next packet
- If packet is lost, it's retransmitted

**Characteristics:**
- **Window Size:** 1 (only one packet at a time)
- **ACK Type:** Individual ACK per packet
- **Retransmission:** Entire packet retried
- **Simplicity:** ⭐⭐⭐⭐⭐ (Very Simple)
- **Efficiency:** ⭐☆☆☆☆ (Very Low)

**Advantages:**
- Very simple to understand and implement
- Low buffer requirements
- Works on any link

**Disadvantages:**
- Very inefficient - lots of idle time waiting
- High latency for long-distance links
- Poor utilization of network bandwidth

**Use Cases:**
- Legacy communication systems
- Very reliable, low-speed links
- Educational purposes

---

### 2. **Go-Back-N Protocol**
**How it works:**
- Sender can transmit up to N packets without waiting for ACKs (sliding window)
- Receiver sends cumulative ACKs (acknowledges all packets up to sequence number)
- If ANY packet in the window is lost, sender goes back and retransmits ALL subsequent packets from that point

**Characteristics:**
- **Window Size:** N (configurable, typically 4-8)
- **ACK Type:** Cumulative (one ACK for multiple packets)
- **Retransmission:** All packets from point of loss onwards
- **Complexity:** ⭐⭐⭐☆☆ (Moderate)
- **Efficiency:** ⭐⭐⭐☆☆ (Moderate)

**Advantages:**
- Better bandwidth utilization than Stop-and-Wait
- Only needs one ACK channel
- Simpler than Selective Repeat

**Disadvantages:**
- Wastes bandwidth retransmitting packets that were already received successfully
- Inefficient on high-loss networks

**Use Cases:**
- Older computer networks
- Moderate-speed links
- Systems with simple receivers

---

### 3. **Selective Repeat Protocol**
**How it works:**
- Sender can transmit up to N packets without waiting for ACKs
- Receiver sends individual ACKs for each packet
- If a packet is lost, ONLY that specific packet is retransmitted
- Receiver buffers out-of-order packets and delivers them in order

**Characteristics:**
- **Window Size:** N (configurable, typically 4-8)
- **ACK Type:** Individual ACK per packet
- **Retransmission:** Only lost packets
- **Complexity:** ⭐⭐⭐⭐☆ (More Complex)
- **Efficiency:** ⭐⭐⭐⭐⭐ (Highest)

**Advantages:**
- Best bandwidth utilization
- Minimal retransmission overhead
- Efficient on high-loss networks

**Disadvantages:**
- More complex implementation
- Requires more buffer space at receiver
- Needs individual ACK handling

**Use Cases:**
- Modern protocols (TCP with SACK option)
- Wireless networks
- Satellite communications
- High-loss networks

---

## How to Use This Simulation

### Controls
1. **Start Button:** Begins the automatic simulation
2. **Stop Button:** Pauses the simulation
3. **Reset Button:** Clears all packets and restarts

### Visual Elements

**Packet Colors:**
- 🟫 **Gray:** Pending (not yet sent)
- 🟦 **Blue:** Sent (in transit)
- 🟩 **Green:** Acknowledged (successfully received)
- 🟥 **Red:** Lost (dropped by network)

**Visual Indicators:**
- **Black Border:** Packet is within the sender's window
- **Gray Border:** Packet is outside the window
- **Bold Number:** Packet sequence number

### Statistics Display
- **Step:** Current iteration of the simulation
- **Packets Sent:** Number of packets transmitted
- **Acknowledged:** Number of successfully received packets
- **Lost Packets:** Number of dropped packets
- **Completion %:** Percentage of transmission complete

### Protocol Information Panel
Each page shows:
- Current window position (Base and NextSeq pointers)
- Protocol-specific characteristics and behaviors
- Real-time statistics
- Color legend for packet status

---

## Simulation Parameters

### Window Size
- **Default:** 4 packets
- **Effect:** Determines how many packets can be sent before ACK
  - Larger window = better throughput (but more retransmission on loss)
  - Smaller window = less efficient

### Loss Rate
- **Default:** 15% (0.15)
- **Effect:** Probability that a packet will be lost during transmission
  - Higher loss rate = more retransmissions visible
  - 0% = no packet loss (unrealistic)
  - 100% = all packets lost

---

## Key Differences at a Glance

| Feature | Stop-and-Wait | Go-Back-N | Selective Repeat |
|---------|---------------|-----------|-----------------|
| Window Size | 1 | N | N |
| Sending | One at a time | Multiple | Multiple |
| ACK Type | Individual | Cumulative | Individual |
| On Loss | Resend one | Resend N packets | Resend one |
| Receiver Buffer | None | None | Yes (size N) |
| Efficiency | Very Low | Moderate | High |
| Complexity | Simple | Moderate | Complex |

---

## Educational Insights

### Bandwidth Efficiency
- **Stop-and-Wait:** Severely limited by round-trip time (RTT)
  - Formula: Utilization = 1/(1 + 2×(Propagation Delay/Transmission Time))
  - On long distances, very inefficient

- **Go-Back-N & Selective Repeat:** Better utilization
  - Can send multiple packets in parallel
  - Utilization approaches 100% with proper window size

### Retransmission Overhead
- **Stop-and-Wait:** Retransmits 1 packet per loss
- **Go-Back-N:** Retransmits N packets per loss (wasteful!)
- **Selective Repeat:** Retransmits 1 packet per loss (optimal!)

### Real-World Applications
- **TCP:** Uses Selective Repeat approach (SACK option)
- **QUIC:** Uses Selective Repeat with optimizations
- **File Transfer Protocols:** Often use Go-Back-N
- **Legacy Systems:** May still use Stop-and-Wait

---

## Common Observations During Simulation

1. **Stop-and-Wait:** You'll notice very slow progress and lots of waiting
2. **Go-Back-N:** When a packet is lost, you'll see multiple packets resent
3. **Selective Repeat:** Only the lost packet is resent, others continue normally

---

## Troubleshooting

**Simulation not starting?**
- Click "Reset" first, then "Start"
- Check browser console for errors

**Packets not showing?**
- Make sure window size is set appropriately
- Try resetting the simulation

**All packets always received?**
- Increase loss rate to see failures
- Click "Reset" to randomize again

---

## Learning Objectives

By using this simulation, you should understand:
1. ✅ How sliding window protocols work
2. ✅ The trade-offs between protocols
3. ✅ Impact of window size on performance
4. ✅ Effects of packet loss on throughput
5. ✅ Differences between cumulative and individual ACKs
6. ✅ Bandwidth utilization concepts
7. ✅ Real-world protocol choices and why

---

## Further Reading

- **Computer Networks** by Kurose & Ross
- **TCP/IP Illustrated** by Stevens
- **RFC 793** (TCP Specification)
- **RFC 9200** (QUIC Protocol)

---

Enjoy learning! 🎓
