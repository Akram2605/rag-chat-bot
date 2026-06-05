"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! Ask me anything about your documents." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMsg() {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: q }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error: Could not reach the server." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <span className="text-2xl">📄</span>
          <h2 className="text-lg font-semibold text-gray-800">RAG Chatbot</h2>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[78%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white self-end rounded-br-sm"
                  : "bg-gray-100 text-gray-800 self-start rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="max-w-[78%] px-4 py-2.5 rounded-xl text-sm leading-relaxed bg-gray-100 text-gray-400 italic self-start rounded-bl-sm">
              Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input row */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 outline-none focus:border-blue-500 transition-colors"
            placeholder="Ask a question about your docs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            autoFocus
          />
          <button
            onClick={sendMsg}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
