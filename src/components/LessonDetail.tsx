import { useState } from "react";
import { ArrowLeft, BookOpen, Sparkles, HelpCircle, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { Lesson, UserProfile } from "../types";
import {
  RoundingWidget,
  FractionWidget,
  DecimalsWidget,
  EquationsWidget,
  GeometryWidget,
} from "./InteractiveWidgets";

interface LessonDetailProps {
  lesson: Lesson;
  onBack: () => void;
  onStartQuiz: () => void;
  userProfile: UserProfile;
  onXpGain: (amount: number, reason: string) => void;
}

export default function LessonDetail({
  lesson,
  onBack,
  onStartQuiz,
  userProfile,
  onXpGain,
}: LessonDetailProps) {
  const [activeTab, setActiveTab] = useState<"theory" | "interactive" | "examples">("theory");
  const [openExampleIdx, setOpenExampleIdx] = useState<number | null>(null);

  const isCompleted = userProfile.completedLessons.includes(lesson.id);
  const lang = userProfile.language || "kg";
  const isRu = lang === "ru";

  // Map widget IDs to components
  const renderInteractiveWidget = () => {
    const roundingMsg = isRu ? "Ты использовал инструмент округления" : "Тегеректөө куралын колдондуң";
    const fractionMsg = isRu ? "Ты использовал инструмент дробей" : "Бөлчөктөр куралын колдондуң";
    const decimalsMsg = isRu ? "Ты использовал десятичный инструмент" : "Ондук бөлчөк куралын колдондуң";
    const equationsMsg = isRu ? "Ты использовал инструмент уравнений" : "Теңдемелер куралын колдондуң";
    const geometryMsg = isRu ? "Ты использовал геометрический инструмент" : "Геометрия куралын колдондуң";

    switch (lesson.interactiveWidget) {
      case "rounding":
        return <RoundingWidget lang={lang} onSuccess={() => onXpGain(10, roundingMsg)} />;
      case "fractions":
        return <FractionWidget lang={lang} onSuccess={() => onXpGain(10, fractionMsg)} />;
      case "decimals":
        return <DecimalsWidget lang={lang} onSuccess={() => onXpGain(10, decimalsMsg)} />;
      case "equations":
        return <EquationsWidget lang={lang} onSuccess={() => onXpGain(10, equationsMsg)} />;
      case "geometry":
        return <GeometryWidget lang={lang} onSuccess={() => onXpGain(10, geometryMsg)} />;
      default:
        return <p className="text-xs text-natural-gray">{isRu ? "Интерактивный инструмент готовится..." : "Интерактивдүү курал даярдалууда..."}</p>;
    }
  };

  // Simple rich text formatting for lesson notes
  const renderTheoryText = (text: string) => {
    let formatted = text
      .replace(/### (.*)/g, '<h4 class="font-sans font-extrabold text-natural-dark text-sm mt-4 mb-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-[#445044]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-natural-bg px-1 py-0.5 rounded font-mono text-natural-orange-text text-[11px] border border-natural-border">$1</code>')
      // Custom block formatting for markdown lists
      .replace(/\n\* (.*)/g, '<li class="ml-4 list-disc text-xs sm:text-sm text-natural-dark font-medium my-1">$1</li>')
      // Custom LaTeX-like notation placeholder formatting
      .replace(/\$\$P = 2 \\cdot \(a \+ b\)\$\$/g, '<div class="bg-natural-bg border border-natural-border p-2 text-center rounded-lg font-mono font-extrabold text-natural-dark my-2">P = 2 × (a + b)</div>')
      .replace(/\$\$S = a \\cdot b\$\$/g, '<div class="bg-natural-bg border border-natural-border p-2 text-center rounded-lg font-mono font-extrabold text-natural-dark my-2">S = a × b</div>')
      .replace(/\$\$V = a \\cdot b \\cdot c\$\$/g, '<div class="bg-natural-bg border border-natural-border p-2 text-center rounded-lg font-mono font-extrabold text-natural-dark my-2">V = a × b × c</div>')
      .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '<span class="inline-flex flex-col items-center align-middle font-mono text-xs font-extrabold px-1"><span class="border-b border-natural-dark">$1</span><span>$2</span></span>')
      .replace(/\n/g, "<br />");

    return <div dangerouslySetInnerHTML={{ __html: formatted }} className="leading-relaxed text-xs sm:text-sm text-natural-dark space-y-1" />;
  };

  // Translation helpers
  const labelBack = isRu ? "Назад" : "Артка";
  const labelCompleted = isRu ? "✓ Пройдено" : "✓ Окулуп бүттү";
  const labelTheory = isRu ? "Теория" : "Теория";
  const labelInteractive = isRu ? "Интерактив" : "Интерактив";
  const labelExamples = isRu ? "Примеры" : "Мисалдар";
  const labelExamplesHeader = isRu ? "Решение задач из реальной жизни:" : "Турмуштан алынган маселелердин чыгарылышы:";
  const labelSolution = isRu ? "✍️ Решение:" : "✍️ Чыгарылышы:";
  const labelCheckKnowledge = isRu ? "Проверь свои знания!" : "Билимиңди текшер!";
  const labelQuizDescription = isRu 
    ? "Пройди короткий тест по этой теме, заработай до +100 XP и получи медали!"
    : "Бул тема боюнча кыскача тесттен өтүп, +100 XP чейин упай жана медалдарды утуп ал!";
  const labelStartQuiz = isRu ? "Начать тест 🚀" : "Тестти Баштоо 🚀";

  return (
    <div className="space-y-5 pb-6" id="lesson-detail">
      {/* Detail Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-natural-gray hover:text-natural-dark transition bg-white border border-natural-border px-3 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>{labelBack}</span>
        </button>

        {isCompleted && (
          <span className="bg-natural-green/20 text-natural-green-text text-[10px] font-extrabold px-3 py-1 rounded-full border border-natural-green-text/25 flex items-center gap-1">
            {labelCompleted}
          </span>
        )}
      </div>

      {/* Lesson Title Banner */}
      <div>
        <h2 className="font-sans font-black text-lg sm:text-xl text-natural-dark leading-tight">
          {lesson.title}
        </h2>
        <p className="text-xs text-natural-gray mt-1 font-medium">{lesson.description}</p>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex bg-[#E8E2D9]/45 p-1 rounded-xl border border-natural-border">
        <button
          onClick={() => {
            setActiveTab("theory");
            onXpGain(2, isRu ? "Ты начал читать теорию" : "Теорияны окуй баштадың");
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
            activeTab === "theory"
              ? "bg-white text-[#445044] shadow-sm"
              : "text-natural-gray hover:text-natural-dark"
          }`}
        >
          <BookOpen size={13} />
          <span>{labelTheory}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("interactive");
            onXpGain(2, isRu ? "Ты открыл интерактивный инструмент" : "Практика куралын ачтың");
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
            activeTab === "interactive"
              ? "bg-white text-[#445044] shadow-sm"
              : "text-natural-gray hover:text-natural-dark"
          }`}
        >
          <Sparkles size={13} />
          <span>{labelInteractive}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("examples");
            onXpGain(2, isRu ? "Ты смотришь практические примеры" : "Үлгү мисалдарды карап жатасың");
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
            activeTab === "examples"
              ? "bg-white text-[#445044] shadow-sm"
              : "text-natural-gray hover:text-natural-dark"
          }`}
        >
          <HelpCircle size={13} />
          <span>{labelExamples}</span>
        </button>
      </div>

      {/* Active Tab Content Area */}
      <div className="min-h-[200px]">
        {activeTab === "theory" && (
          <div className="bg-white rounded-3xl p-5 border border-natural-border shadow-sm space-y-4 animate-fade-in">
            {renderTheoryText(lesson.theory)}
          </div>
        )}

        {activeTab === "interactive" && (
          <div className="space-y-4 animate-fade-in">
            {renderInteractiveWidget()}
          </div>
        )}

        {activeTab === "examples" && (
          <div className="space-y-3 animate-fade-in">
            <h4 className="font-sans font-extrabold text-natural-dark text-xs px-1 uppercase tracking-wider">
              {labelExamplesHeader}
            </h4>
            <div className="space-y-2.5">
              {lesson.examples.map((example, idx) => {
                const isOpen = openExampleIdx === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-natural-border rounded-2xl overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setOpenExampleIdx(isOpen ? null : idx)}
                      className="w-full p-4 flex justify-between items-center text-left hover:bg-natural-bg/50 transition"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-mono font-extrabold text-natural-orange-text text-xs mt-0.5">#{idx + 1}</span>
                        <span className="font-sans font-extrabold text-xs sm:text-sm text-natural-dark leading-relaxed">
                          {example.problem}
                        </span>
                      </div>
                      <span className="text-natural-gray">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="p-4 bg-natural-green/15 border-t border-natural-border text-xs sm:text-sm text-natural-dark leading-relaxed animate-fade-in">
                        <p className="font-extrabold text-[#445044] mb-1">{labelSolution}</p>
                        <p className="font-medium">{example.solution}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quiz Call to Action Banner */}
      <div className="bg-[#445044] rounded-3xl p-5 text-white flex items-center justify-between gap-4 shadow-sm mt-4 border border-[#526052]">
        <div>
          <h4 className="font-sans font-black text-sm flex items-center gap-1.5 text-natural-bg">
            <Trophy size={16} fill="#F3E99F" className="text-natural-yellow" />
            {labelCheckKnowledge}
          </h4>
          <p className="text-[10px] text-natural-bg/85 mt-1 leading-normal max-w-[210px] font-medium">
            {labelQuizDescription}
          </p>
        </div>
        <button
          onClick={onStartQuiz}
          className="bg-natural-yellow hover:bg-natural-yellow-dark text-natural-yellow-text border border-natural-yellow-dark/20 py-3 px-4 rounded-2xl text-xs font-black transition shrink-0 shadow-md hover:scale-105"
        >
          {labelStartQuiz}
        </button>
      </div>
    </div>
  );
}
