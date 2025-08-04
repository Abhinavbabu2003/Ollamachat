"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Moon, Sun, Settings, Zap, Cpu } from "lucide-react"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function App() {
  const [theme, setTheme] = useState("dark")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant powered by Ollama. How can I help you today?",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("llama3.2:3b")
  const [availableModels, setAvailableModels] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get("http://localhost:8000/models", {
          timeout: 5000, // 5 second timeout
        })
        setAvailableModels(response.data.models || [])
        setIsConnected(true)
      } catch (err) {
        console.warn("Ollama server not available, using demo mode")
        // Fallback to demo models when server is not available
        setAvailableModels(["llama3.2:3b", "llama3.2:1b", "codellama:7b", "mistral:7b", "phi3:mini"])
        setIsConnected(false)
      }
    }

    fetchModels()
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = { role: "user", content: message }
    setMessages((prev) => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)

    try {
      // Check if we're in demo mode (server not connected)
      if (!isConnected) {
        // Simulate API response for demo purposes
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const demoResponses = [
          "I'm running in demo mode since the Ollama server isn't available. In a real setup, I would connect to your local Ollama instance to provide AI responses.",
          "This is a demonstration response. To get real AI responses, please ensure your Ollama server is running on localhost:8000.",
          'Demo mode active! Your message was: "' + message + '". Connect to Ollama server for actual AI responses.',
          "I'm simulating a response since the Ollama server is not connected. Please check your server configuration.",
        ]

        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)]

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: randomResponse,
          },
        ])

        setIsLoading(false)
        return
      }

      const response = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, model: selectedModel }),
      })

      if (!response.ok) throw new Error("Response not OK")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader available")

      const decoder = new TextDecoder()
      const assistantMessage = { role: "assistant", content: "" }
      setMessages((prev) => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n").filter((line) => line.trim() !== "")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6))
              if (data.token) {
                assistantMessage.content += data.token
                setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage }])
              }
            } catch (err) {
              console.error("Parsing error:", err)
            }
          }
        }
      }
    } catch (err) {
      console.error("Error during chat:", err)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please check if your Ollama server is running and try again!",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Theme styles
  const themeStyles = {
    light: {
      container: {
        background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
        color: "#0f172a",
      },
      sidebar: {
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(226, 232, 240, 0.5)",
      },
      chat: {
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(8px)",
      },
      input: {
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(226, 232, 240, 0.5)",
      },
      text: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#94a3b8",
      card: {
        background: "rgba(255, 255, 255, 0.5)",
        border: "1px solid rgba(226, 232, 240, 0.5)",
      },
      cardDark: {
        background: "rgba(255, 255, 255, 0.3)",
        border: "1px solid rgba(226, 232, 240, 0.5)",
      },
      userBubble: {
        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        color: "#ffffff",
      },
      assistantBubble: {
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(226, 232, 240, 0.5)",
        color: "#0f172a",
      },
      accent: "#2563eb",
    },
    dark: {
      container: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 20%, #0f172a 100%)",
        color: "#ffffff",
      },
      sidebar: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(71, 85, 105, 0.5)",
      },
      chat: {
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(8px)",
      },
      input: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(71, 85, 105, 0.5)",
      },
      text: "#ffffff",
      textSecondary: "#cbd5e1",
      textMuted: "#64748b",
      card: {
        background: "rgba(30, 41, 59, 0.5)",
        border: "1px solid rgba(71, 85, 105, 0.5)",
      },
      cardDark: {
        background: "rgba(30, 41, 59, 0.3)",
        border: "1px solid rgba(71, 85, 105, 0.5)",
      },
      userBubble: {
        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        color: "#ffffff",
      },
      assistantBubble: {
        background: "rgba(30, 41, 59, 0.9)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(71, 85, 105, 0.5)",
        color: "#ffffff",
      },
      accent: "#60a5fa",
    },
  }

  const currentTheme = themeStyles[theme]

  // Common styles
  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: "all 0.2s ease",
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: theme === "dark" ? "1px solid rgba(71, 85, 105, 0.5)" : "1px solid rgba(226, 232, 240, 0.5)",
    background: theme === "dark" ? "rgba(30, 41, 59, 0.5)" : "rgba(255, 255, 255, 0.5)",
    color: currentTheme.text,
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease",
    backdropFilter: "blur(8px)",
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        transition: "all 0.3s ease",
        ...currentTheme.container,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "320px",
          ...currentTheme.sidebar,
        }}
      >
        <div
          style={{
            padding: "24px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={20} color="#ffffff" />
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    width: "12px",
                    height: "12px",
                    background: "#10b981",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    margin: 0,
                  }}
                >
                  Ollama AI
                </h1>
                <p
                  style={{
                    fontSize: "12px",
                    color: currentTheme.textMuted,
                    margin: 0,
                  }}
                >
                  Neural Interface
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                ...buttonStyle,
                background: "transparent",
                color: currentTheme.text,
                padding: "8px",
                borderRadius: "50%",
              }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* Connection Status */}
          <div
            style={{
              ...cardStyle,
              ...currentTheme.card,
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isConnected ? "#10b981" : "#ef4444",
                  animation: isConnected ? "pulse 2s infinite" : "none",
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: currentTheme.text,
                    margin: 0,
                  }}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: currentTheme.textMuted,
                    margin: 0,
                  }}
                >
                  {isConnected ? "Ollama Server Online" : "Check Ollama Server"}
                </p>
              </div>
              <Cpu size={16} color={currentTheme.accent} />
            </div>
          </div>

          {/* Model Selection */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: currentTheme.textSecondary,
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Zap size={14} />
              <span>AI Model</span>
            </label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} style={inputStyle}>
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))
              ) : (
                <option value={selectedModel}>{selectedModel}</option>
              )}
            </select>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                ...cardStyle,
                ...currentTheme.cardDark,
                padding: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: currentTheme.textMuted,
                  margin: 0,
                }}
              >
                Messages
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: currentTheme.accent,
                  margin: 0,
                }}
              >
                {messages.length}
              </p>
            </div>
            <div
              style={{
                ...cardStyle,
                ...currentTheme.cardDark,
                padding: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: currentTheme.textMuted,
                  margin: 0,
                }}
              >
                Model
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: currentTheme.accent,
                  margin: 0,
                }}
              >
                AI
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "auto" }}>
            <div
              style={{
                ...cardStyle,
                background:
                  theme === "dark"
                    ? "linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(88, 28, 135, 0.2) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(224, 242, 254, 0.5) 100%)",
                border: theme === "dark" ? "1px solid rgba(71, 85, 105, 0.5)" : "1px solid rgba(226, 232, 240, 0.5)",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Settings size={14} color={currentTheme.accent} />
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: currentTheme.text,
                    margin: 0,
                  }}
                >
                  System Status
                </p>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: currentTheme.textMuted,
                  margin: 0,
                  lineHeight: "1.4",
                }}
              >
                Ollama AI is running locally on your machine. All conversations are private and secure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Chat Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            ...currentTheme.chat,
          }}
        >
          <div
            style={{
              maxWidth: "1024px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    maxWidth: "80%",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      ...(msg.role === "user"
                        ? currentTheme.userBubble
                        : {
                            background: theme === "dark" ? "#374151" : "#ffffff",
                            border: theme === "dark" ? "1px solid #4b5563" : "1px solid #e5e7eb",
                          }),
                    }}
                  >
                    {msg.role === "user" ? (
                      <User size={16} color="#ffffff" />
                    ) : (
                      <Bot size={16} color={theme === "dark" ? "#cbd5e1" : "#475569"} />
                    )}
                  </div>
                  <div
                    style={{
                      ...cardStyle,
                      padding: "16px",
                      ...(msg.role === "user" ? currentTheme.userBubble : currentTheme.assistantBubble),
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p style={{ margin: "8px 0", lineHeight: "1.5" }}>{children}</p>,
                        pre: ({ children }) => (
                          <pre
                            style={{
                              background: "rgba(15, 23, 42, 0.8)",
                              color: "#e2e8f0",
                              borderRadius: "8px",
                              padding: "16px",
                              margin: "8px 0",
                              overflow: "auto",
                            }}
                          >
                            {children}
                          </pre>
                        ),
                        code: ({ children, ...props }) =>
                          props.className ? (
                            <code {...props}>{children}</code>
                          ) : (
                            <code
                              style={{
                                background: "rgba(148, 163, 184, 0.1)",
                                padding: "2px 4px",
                                borderRadius: "4px",
                                fontSize: "0.875em",
                              }}
                            >
                              {children}
                            </code>
                          ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    maxWidth: "80%",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: theme === "dark" ? "#374151" : "#ffffff",
                      border: theme === "dark" ? "1px solid #4b5563" : "1px solid #e5e7eb",
                    }}
                  >
                    <Bot size={16} color={theme === "dark" ? "#cbd5e1" : "#475569"} />
                  </div>
                  <div
                    style={{
                      ...cardStyle,
                      padding: "16px",
                      ...currentTheme.assistantBubble,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              width: "8px",
                              height: "8px",
                              background: "#3b82f6",
                              borderRadius: "50%",
                              animation: `bounce 1.4s infinite ease-in-out`,
                              animationDelay: `${i * 0.16}s`,
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          fontSize: "14px",
                          color: currentTheme.textMuted,
                        }}
                      >
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: "24px",
            ...currentTheme.input,
          }}
        >
          <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <textarea
                  placeholder="Message Ollama AI..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  rows={3}
                  style={{
                    ...inputStyle,
                    minHeight: "60px",
                    resize: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                style={{
                  ...buttonStyle,
                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  color: "#ffffff",
                  height: "60px",
                  padding: "0 24px",
                  opacity: !message.trim() || isLoading ? 0.5 : 1,
                  cursor: !message.trim() || isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      borderTop: "2px solid #ffffff",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: theme === "dark" ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 1)",
                    color: theme === "dark" ? "#cbd5e1" : "#475569",
                  }}
                >
                  {selectedModel}
                </span>
                <p
                  style={{
                    fontSize: "12px",
                    color: currentTheme.textMuted,
                    margin: 0,
                  }}
                >
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: isConnected ? "#10b981" : "#ef4444",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: currentTheme.textMuted,
                    margin: 0,
                  }}
                >
                  {isConnected ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
