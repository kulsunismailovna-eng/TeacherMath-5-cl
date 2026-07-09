import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, RefreshCw } from "lucide-react";
import { ChatMessage, UserProfile } from "../types";

interface MathTutorProps {
  userProfile: UserProfile;
  onXpGain: (amount: number, reason: string) => void;
}

const TUTOR_TRANSLATIONS = {
  kg: {
    tutor_name: "Айпери Мугалим",
    status: "Азыр байланышта • AI Жардамчы",
    welcome: (name: string) => `Салам, **${name}**! 🌟 Менин атым **Айпери**. Мен сенин математика боюнча жардамчыңмын! 

Мен 5-класстын математикасындагы каалаган теманы (бөлчөктөр, ондук бөлчөктөр, теңдемелер же аянттар) түшүндүрүп бере алам. Мага суроо бер же "Мага бир кызыктуу маселе берчи" деп жаз. Эмнени чогуу үйрөнөбүз? 😊`,
    xp_reason: "Айпери мугалимден суроо сурадың",
    error_msg: "Кечиресиң, интернет байланышында ката кетти. Мага суроону дагы бир жолу берип көрөсүңбү? 🥺",
    error_response: "Ката кетти.",
    clear_confirm: "Чатты тазалап, кайра баштагыңыз келеби?",
    clear_title: "Кайра баштоо",
    suggestions: [
      "Бөлчөктөрдү кошууну түшүндүрчү",
      "Теңдемени кантип чыгарам?",
      "Мага бир математикалык табышмак берчи",
      "Мага 5-класстын маселесин берчи",
    ],
    placeholder: "Айпериге суроо бериңиз (мис: Бөлчөктөрдү түшүндүр)..."
  },
  ru: {
    tutor_name: "Учитель Айпери",
    status: "В сети • AI Помощник",
    welcome: (name: string) => `Привет, **${name}**! 🌟 Меня зовут **Айпери**. Я твой помощник по математике! 

Я могу объяснить тебе любую тему по математике за 5 класс (дроби, десятичные дроби, уравнения или площадь). Задай мне вопрос или напиши "Дай мне интересную задачу". Что мы будем изучать сегодня? 😊`,
    xp_reason: "Ты задал вопрос учителю Айпери",
    error_msg: "Извини, произошла ошибка подключения к интернету. Не мог бы ты задать вопрос еще раз? 🥺",
    error_response: "Произошла ошибка.",
    clear_confirm: "Очистить чат и начать сначала?",
    clear_title: "Начать сначала",
    suggestions: [
      "Объясни сложение дробей",
      "Как решить уравнение?",
      "Загадай мне математическую загадку",
      "Дай мне задачу за 5 класс",
    ],
    placeholder: "Задай вопрос Айпери (например: Объясни дроби)..."
  }
};

export default function MathTutor({ userProfile, onXpGain }: MathTutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lang = userProfile.language || "kg";
  const t = TUTOR_TRANSLATIONS[lang] || TUTOR_TRANSLATIONS.kg;

  // Initial messages
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: t.welcome(userProfile.name),
          timestamp: Date.now(),
        },
      ]);
    }
  }, [userProfile.name, lang]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const rawText = textToSend || input;
    const cleanText = rawText.trim();
    if (!cleanText || loading) return;

    if (!textToSend) {
      setInput("");
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text: cleanText,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userProfile,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: "assistant",
            text: data.text,
            timestamp: Date.now(),
          },
        ]);
        
        // Award XP for asking a question (limit per turn)
        onXpGain(15, t.xp_reason);
      } else {
        throw new Error(data.error || t.error_response);
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          text: t.error_msg,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestionChips = t.suggestions;

  // Render markdown text roughly using custom html blocks
  const renderMessageText = (text: string) => {
    // Basic Markdown replacement for bold ** and lists
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-natural-dark">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-natural-bg border border-natural-border px-1.5 py-0.5 rounded font-mono text-natural-orange-text text-xs">$1</code>')
      .replace(/\n/g, "<br />");

    return <div dangerouslySetInnerHTML={{ __html: html }} className="leading-relaxed text-xs sm:text-sm text-natural-dark" />;
  };

  return (
    <div className="flex flex-col h-full bg-natural-bg rounded-2xl overflow-hidden border border-natural-border shadow-sm" id="math-tutor">
      {/* Tutor Header */}
      <div className="bg-[#445044] p-4 text-white flex items-center justify-between border-b border-[#526052]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-natural-bg/15 border border-natural-bg/25 flex items-center justify-center text-xl shadow-inner font-bold">
            👩‍🏫
          </div>
          <div>
            <h3 className="font-sans font-extrabold text-sm text-natural-bg">{t.tutor_name}</h3>
            <p className="text-[10px] text-natural-bg/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-natural-yellow animate-pulse"></span>
              {t.status}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(t.clear_confirm)) {
              setMessages([]);
            }
          }}
          className="p-1.5 rounded-full hover:bg-white/10 text-natural-bg/80 hover:text-white transition"
          title={t.clear_title}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px] min-h-[300px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm shrink-0 ${
                msg.role === "user"
                  ? "bg-natural-green text-natural-green-text border border-natural-green-text/25"
                  : "bg-white border border-natural-border text-natural-dark"
              }`}
            >
              {msg.role === "user" ? <User size={14} /> : "👩‍🏫"}
            </div>

            {/* Bubble */}
            <div
              className={`p-3 rounded-2xl shadow-sm border transition-all ${
                msg.role === "user"
                  ? "bg-natural-yellow text-natural-yellow-text border-natural-yellow-dark/30 rounded-tr-none"
                  : "bg-white text-natural-dark border-natural-border rounded-tl-none"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-xs sm:text-sm leading-relaxed font-medium">{msg.text}</p>
              ) : (
                renderMessageText(msg.text)
              )}
              <span
                className={`text-[9px] block text-right mt-1.5 ${
                  msg.role === "user" ? "text-natural-yellow-text/80" : "text-natural-gray"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5 max-w-[85%] mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white border border-natural-border text-sm flex items-center justify-center text-natural-gray">
              👩‍🏫
            </div>
            <div className="bg-white text-natural-dark border border-natural-border p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-natural-gray rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-natural-gray rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-natural-gray rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-natural-bg border-t border-natural-border flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="text-[11px] font-bold bg-white border border-natural-border hover:border-natural-yellow-dark text-natural-yellow-text hover:bg-natural-yellow/10 py-1.5 px-3 rounded-full shrink-0 transition shadow-sm"
            >
              💡 {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Tray */}
      <div className="p-3 bg-white border-t border-natural-border flex gap-2 items-center shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={t.placeholder}
          className="flex-1 text-xs sm:text-sm bg-natural-bg border border-natural-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-natural-yellow-dark focus:ring-1 focus:ring-natural-yellow/30 text-natural-dark font-medium"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          className="w-10 h-10 shrink-0 rounded-xl bg-[#445044] hover:bg-[#343e34] text-white flex items-center justify-center transition shadow-sm disabled:opacity-50"
          disabled={!input.trim() || loading}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
