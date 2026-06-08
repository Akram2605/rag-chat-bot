"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "bot"; text: string };
type Tab = "chat" | "documents";
type IngestStatus = "idle" | "ingesting" | "done" | "error";
type IngestResult = { file: string; chunks: number };

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! Ask me anything about your documents." },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Documents state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus>("idle");
  const [ingestResults, setIngestResults] = useState<IngestResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Chat ────────────────────────────────────────────────────────────────
  async function sendMsg() {
    const q = input.trim();
    if (!q || chatLoading) return;
    setInput("");
    setChatLoading(true);
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
      setChatLoading(false);
    }
  }

  // ── File selection ───────────────────────────────────────────────────────
  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const allowed = Array.from(incoming).filter((f) =>
      /\.(pdf|txt|md)$/i.test(f.name)
    );
    setSelectedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...allowed.filter((f) => !names.has(f.name))];
    });
    setIngestStatus("idle");
  }

  function removeFile(name: string) {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  // ── Ingest ───────────────────────────────────────────────────────────────
  async function ingestFiles() {
    if (!selectedFiles.length) return;
    setIngestStatus("ingesting");
    try {
      const form = new FormData();
      selectedFiles.forEach((f) => form.append("files", f));
      const res = await fetch("/api/ingest", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIngestResults(data.ingested);
      setIngestStatus("done");
    } catch {
      setIngestStatus("error");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg flex flex-col h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <h2 className="text-lg font-semibold text-gray-800">RAG Chatbot</h2>
          </div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            {(["chat", "documents"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 capitalize transition-colors ${
                  tab === t
                    ? "bg-blue-500 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t === "chat" ? "💬 Chat" : "📁 Documents"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat tab ── */}
        {tab === "chat" && (
          <>
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
              {chatLoading && (
                <div className="max-w-[78%] px-4 py-2.5 rounded-xl text-sm bg-gray-100 text-gray-400 italic self-start rounded-bl-sm">
                  Thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

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
                disabled={chatLoading}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </>
        )}

        {/* ── Documents tab ── */}
        {tab === "documents" && (
          <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto">

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              <p className="text-3xl mb-2">☁️</p>
              <p className="text-sm font-medium text-gray-700">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, TXT, MD — up to 20 files</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {/* File list */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Selected ({selectedFiles.length})
                </p>
                {selectedFiles.map((f) => {
                  const result = ingestResults.find((r) => r.file === f.name);
                  return (
                    <div
                      key={f.name}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span className="text-gray-700 truncate">{f.name}</span>
                      <span className="flex items-center gap-3 shrink-0 ml-3">
                        {result ? (
                          <span className="text-green-600 text-xs font-medium">{result.chunks} chunks</span>
                        ) : (
                          <span className="text-gray-400 text-xs">{(f.size / 1024).toFixed(0)} KB</span>
                        )}
                        <button
                          onClick={() => removeFile(f.name)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          disabled={ingestStatus === "ingesting"}
                        >
                          ✕
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action button + status */}
            <div className="flex flex-col gap-2 mt-auto">
              {ingestStatus === "done" && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ {ingestResults.length} file{ingestResults.length !== 1 ? "s" : ""} ingested successfully
                </p>
              )}
              {ingestStatus === "error" && (
                <p className="text-sm text-red-500">Ingestion failed. Please try again.</p>
              )}

              <button
                onClick={ingestFiles}
                disabled={!selectedFiles.length || ingestStatus === "ingesting"}
                className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {ingestStatus === "ingesting" ? "Ingesting..." : "Ingest Documents"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
