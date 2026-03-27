"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [animated, setAnimated] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    setAnimated(true);
  }, []);

  const protocols = [
    {
      name: "Stop-and-Wait",
      path: "/stop-and-wait",
      description: "Send one packet and wait for ACK before sending the next",
      color: "from-orange-400 to-red-500",
      icon: "⏱️",
      complexity: "⭐☆☆☆☆",
      efficiency: "⭐☆☆☆☆"
    },
    {
      name: "Go-Back-N",
      path: "/GoBackN",
      description: "Send up to N packets, retransmit all on loss",
      color: "from-blue-400 to-cyan-500",
      icon: "↩️",
      complexity: "⭐⭐⭐☆☆",
      efficiency: "⭐⭐⭐☆☆"
    },
    {
      name: "Selective Repeat",
      path: "/Selective-Repeat",
      description: "Send up to N packets, retransmit only lost packets",
      color: "from-green-400 to-emerald-500",
      icon: "🎯",
      complexity: "⭐⭐⭐⭐☆",
      efficiency: "⭐⭐⭐⭐⭐"
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Animated background elements */}
      <div style={{
        position: "absolute",
        width: 300,
        height: 300,
        background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        top: -100,
        right: -100,
        animation: "float 6s ease-in-out infinite"
      }}></div>
      <div style={{
        position: "absolute",
        width: 400,
        height: 400,
        background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
        borderRadius: "50%",
        bottom: -150,
        left: -150,
        animation: "float 8s ease-in-out infinite 2s"
      }}></div>

      <div style={{
        maxWidth: 1200,
        width: "100%",
        zIndex: 10,
        position: "relative"
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: 60,
          animation: animated ? "slide-in 0.8s ease-out" : "none"
        }}>
          <h1 style={{
            color: "white",
            fontSize: 56,
            fontWeight: 800,
            marginBottom: 12,
            textShadow: "0 10px 40px rgba(0,0,0,0.3)",
            letterSpacing: "-2px",
            lineHeight: 1.2
          }}>
            🌐 Sliding Window Protocols
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 20,
            marginBottom: 8,
            fontWeight: 500
          }}>
            Master Network Communication Algorithms
          </p>

          <div style={{
            height: 4,
            width: 120,
            background: "linear-gradient(90deg, #4ade80, #06b6d4)",
            margin: "16px auto",
            borderRadius: 2
          }}></div>

          <p style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 16,
            maxWidth: 600,
            margin: "0 auto",
            lineHeight: 1.6
          }}>
            Explore three fundamental protocols used in computer networking with interactive simulations and real-time visualizations.
          </p>
        </div>

        {/* Protocol Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 30,
          marginBottom: 50,
          perspective: "1000px"
        }}>
          {protocols.map((protocol, index) => (
            <Link key={index} href={protocol.path} style={{ textDecoration: "none" }}>
              <div
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: `linear-gradient(135deg, ${protocol.color})`,
                  borderRadius: 20,
                  padding: 32,
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: hoveredCard === index ? "translateY(-16px) scale(1.02)" : "translateY(0) scale(1)",
                  boxShadow: hoveredCard === index 
                    ? "0 30px 60px rgba(0,0,0,0.3)" 
                    : "0 10px 30px rgba(0,0,0,0.15)",
                  border: "2px solid rgba(255,255,255,0.1)",
                  position: "relative",
                  overflow: "hidden",
                  animation: animated ? `slide-in 0.6s ease-out ${index * 0.1}s both` : "none"
                }}>
                {/* Card shine effect */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: -100,
                  right: 0,
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  transform: hoveredCard === index ? "translateX(100%)": "translateX(0)",
                  transition: "transform 0.6s ease",
                  pointerEvents: "none"
                }}></div>

                {/* Icon */}
                <div style={{
                  fontSize: 48,
                  marginBottom: 16,
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                }}>
                  {protocol.icon}
                </div>

                <h2 style={{
                  margin: "0 0 12px 0",
                  color: "white",
                  fontSize: 28,
                  fontWeight: 700,
                  textShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}>
                  {protocol.name}
                </h2>

                <p style={{
                  margin: "0 0 20px 0",
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 15,
                  lineHeight: 1.6,
                  minHeight: 60
                }}>
                  {protocol.description}
                </p>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 16,
                  borderTop: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <div>
                    <div style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: 4,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1
                    }}>Complexity</div>
                    <div style={{
                      fontSize: 16,
                      color: "white"
                    }}>{protocol.complexity}</div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: 4,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1
                    }}>Efficiency</div>
                    <div style={{
                      fontSize: 16,
                      color: "white"
                    }}>{protocol.efficiency}</div>
                  </div>
                </div>

                {/* Call to action */}
                <div style={{
                  marginTop: 20,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  textAlign: "center",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.3s ease",
                  transform: hoveredCard === index ? "scale(1.05)" : "scale(1)"
                }}>
                  Start Simulation →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          borderRadius: 20,
          border: "2px solid rgba(255,255,255,0.2)",
          padding: 40,
          color: "white",
          animation: animated ? "fade-in 0.8s ease-out 0.4s both" : "none"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            marginBottom: 30
          }}>
            <div>
              <h3 style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 10
              }}>
                📚 How to Use
              </h3>
              <ol style={{
                margin: 0,
                paddingLeft: 20,
                lineHeight: 1.8,
                fontSize: 15
              }}>
                <li style={{ marginBottom: 12 }}>Select a protocol card above</li>
                <li style={{ marginBottom: 12 }}>Click "Start Simulation" to begin</li>
                <li style={{ marginBottom: 12 }}>Watch packets flow in real-time</li>
                <li>Use controls to pause or reset</li>
              </ol>
            </div>

            <div>
              <h3 style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 10
              }}>
                🎨 Visual Indicators
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 15 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    background: "#e0e0e0",
                    borderRadius: 4
                  }}></div>
                  <span>Pending packets</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    background: "#2196F3",
                    borderRadius: 4
                  }}></div>
                  <span>Sent packets</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    background: "#4CAF50",
                    borderRadius: 4
                  }}></div>
                  <span>Acknowledged</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    background: "#F44336",
                    borderRadius: 4
                  }}></div>
                  <span>Lost packets</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            padding: "20px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            borderLeft: "4px solid #4ade80",
            fontSize: 14,
            lineHeight: 1.6
          }}>
            <strong>💡 Tip:</strong> Each protocol handles packet loss differently. Watch how the window moves and packets are retransmitted to understand the trade-offs between simplicity and efficiency.
          </div>
        </div>
      </div>
    </div>
  );
}
