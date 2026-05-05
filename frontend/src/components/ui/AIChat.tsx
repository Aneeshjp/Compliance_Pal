"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { assistantAPI } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { en: "Summarise my ITC reconciliation",       kn: "ನನ್ನ ITC ಸಮನ್ವಯದ ಸಾರಾಂಶ ನೀಡಿ" },
  { en: "Which vendor caused the most mismatches?", kn: "ಯಾವ ಮಾರಾಟಗಾರ ಹೆಚ್ಚು ತಪ್ಪೊಪ್ಪಿಗೆ ಮಾಡಿದ್ದಾರೆ?" },
  { en: "What is my total ITC at risk?",           kn: "ನನ್ನ ಒಟ್ಟು ITC ಅಪಾಯದಲ್ಲಿ ಎಷ್ಟಿದೆ?" },
  { en: "Which invoices need urgent follow-up?",   kn: "ಯಾವ ಇನ್‌ವಾಯ್ಸ್‌ಗಳಿಗೆ ತುರ್ತು ಅನುಸರಣೆ ಬೇಕು?" },
  { en: "Am I at risk of a GST notice?",           kn: "ನನಗೆ GST ನೋಟಿಸ್ ಅಪಾಯ ಇದೆಯೇ?" },
];

type Lang = "en" | "kn";

const UI = {
  en: {
    title: "GST AI Assistant",
    subtitle: "Powered by Gemini",
    emptyHint: "Ask me anything about your GST data",
    placeholder: "Ask about your GST data...",
    quickLabel: "Quick Questions",
    error: "Sorry, I encountered an error. Please try again.",
  },
  kn: {
    title: "GST AI ಸಹಾಯಕ",
    subtitle: "Gemini ಆಧಾರಿತ",
    emptyHint: "ನಿಮ್ಮ GST ಡೇಟಾ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ",
    placeholder: "ನಿಮ್ಮ GST ಡೇಟಾ ಬಗ್ಗೆ ಕೇಳಿ...",
    quickLabel: "ತ್ವರಿತ ಪ್ರಶ್ನೆಗಳು",
    error: "ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
};

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = UI[lang];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isStreaming) return;

    // Prepend language instruction so the AI responds in the chosen language
    const langInstruction =
      lang === "kn"
        ? "[IMPORTANT: Reply entirely in Kannada script (ಕನ್ನಡ). Do not use English.] "
        : "[IMPORTANT: Reply entirely in English. Do not use Kannada.] ";
    const finalQuestion = langInstruction + question;

    const userMsg: Message = { role: "user", content: question }; // show original
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      for await (const chunk of assistantAPI.queryStream(finalQuestion)) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          updated[updated.length - 1] = { ...last, content: t.error };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      {/* Floating bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-[#6C63FF] to-[#5a52e0]
                   shadow-[0_0_30px_rgba(108,99,255,0.4)]
                   flex items-center justify-center text-white
                   hover:shadow-[0_0_40px_rgba(108,99,255,0.6)]
                   transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px]
                       bg-white border border-slate-200
                       rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6d5cff] to-[#14b8a6] flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                <p className="text-xs text-slate-400">{t.subtitle}</p>
              </div>
              {/* Language Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    lang === "en"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="Switch to English"
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("kn")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    lang === "kn"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  aria-label="Switch to Kannada"
                >
                  ಕನ್ನಡ
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot size={32} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500">{t.emptyHint}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-[#6d5cff] text-white"
                        : "bg-slate-50 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&>p]:my-1 [&>ul]:my-1">
                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-1 px-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#6d5cff]"
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Quick prompts — appear inside scroll area, after responses */}
              {!isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pt-3 mt-2 border-t border-slate-100"
                >
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">{t.quickLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(lang === "kn" ? prompt.kn : prompt.en)}
                        className="px-2.5 py-1.5 rounded-xl text-left
                                   bg-violet-50 text-violet-700 border border-violet-200
                                   hover:bg-violet-100 transition-colors"
                      >
                        <span className="text-[11px] font-medium leading-tight">
                          {lang === "kn" ? prompt.kn : prompt.en}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>


            {/* Input */}
            <div className="border-t border-slate-100 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder={t.placeholder}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2
                             text-sm text-slate-800 placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
                  disabled={isStreaming}
                  aria-label="AI Assistant message input"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isStreaming}
                  className="w-9 h-9 rounded-lg bg-[#6d5cff] flex items-center justify-center
                             text-white disabled:opacity-40 hover:bg-[#5a52e0] transition-colors"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
