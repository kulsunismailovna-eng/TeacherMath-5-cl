import { useState } from "react";
import { CheckCircle, XCircle, ArrowRight, Award, Trophy } from "lucide-react";
import { Lesson, QuizQuestion } from "../types";

// Standard chime generator for quizzes
const playQuizChime = (type: "correct" | "incorrect" | "perfect") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (type === "correct") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "incorrect") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "perfect") {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C major arpeggio
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    }
  } catch (e) {
    console.warn("Audio blocked", e);
  }
};

interface QuizRunnerProps {
  lesson: Lesson;
  onFinish: (score: number, total: number) => void;
  onXpGain: (amount: number, reason: string) => void;
  onClose: () => void;
  lang?: "kg" | "ru";
}

const QUIZ_TRANSLATIONS = {
  kg: {
    perfect_feedback: "Укмуш! Сен чыныгы Математика Баатырысың! Баарын туура таптың! 🏆🎉",
    good_feedback: "Азаматсың! Абдан жакшы жыйынтык. Теманы мыкты түшүнүптүрсүң! 👍🌟",
    try_feedback: "Аракет кылганыңа рахмат! Дагы бир жолу теманы окуп, каталарыңды оңдоп көрчү. Баары алдыда! 💪😊",
    completed_title: "Тест Аяктады!",
    topic_label: "тема:",
    correct_answers: "туура жооптор ({percentage}%)",
    total_xp_earned: "🎉 Жалпы алынган упай: +{amount} XP!",
    back_to_dashboard: "Башкы бетке кайтуу",
    try_again: "Кайра аракет кылуу",
    question_title: "Тест суроосу",
    quit_btn: "Чыгуу ✕",
    explanation_title: "🧐 Түшүндүрмө:",
    check_btn: "Жоопту текшерүү",
    next_btn: "Кийинки суроо",
    finish_btn: "Жыйынтыктоо",
    xp_reason_correct: (idx: number) => `Тесттин ${idx}-суроосуна туура жооп бердиң`,
    xp_reason_perfect: "Тесттен 100% туура жооп бердиң! (Эсеп Чемпион)",
  },
  ru: {
    perfect_feedback: "Великолепно! Ты настоящий герой математики! Всё правильно! 🏆🎉",
    good_feedback: "Молодец! Очень хороший результат. Ты отлично понял тему! 👍🌟",
    try_feedback: "Спасибо за старания! Попробуй прочитать тему еще раз и исправить свои ошибки. Всё получится! 💪😊",
    completed_title: "Тест Завершен!",
    topic_label: "тема:",
    correct_answers: "правильные ответы ({percentage}%)",
    total_xp_earned: "🎉 Всего получено: +{amount} XP!",
    back_to_dashboard: "Вернуться на главную",
    try_again: "Попробовать снова",
    question_title: "Вопрос теста",
    quit_btn: "Выйти ✕",
    explanation_title: "🧐 Объяснение:",
    check_btn: "Проверить ответ",
    next_btn: "Следующий вопрос",
    finish_btn: "Завершить",
    xp_reason_correct: (idx: number) => `Ты правильно ответил на ${idx}-й вопрос теста`,
    xp_reason_perfect: "Ты ответил на 100% правильно! (Чемпион Счёта)",
  }
};

export default function QuizRunner({ lesson, onFinish, onXpGain, onClose, lang = "kg" }: QuizRunnerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const t = QUIZ_TRANSLATIONS[lang] || QUIZ_TRANSLATIONS.kg;

  const questions = lesson.quiz;
  const currentQuestion: QuizQuestion = questions[currentIdx];

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIdx(idx);
  };

  const handleSubmit = () => {
    if (selectedIdx === null || isSubmitted) return;
    
    setIsSubmitted(true);
    const isCorrect = selectedIdx === currentQuestion.correctIndex;
    
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      playQuizChime("correct");
      onXpGain(20, t.xp_reason_correct(currentIdx + 1));
    } else {
      playQuizChime("incorrect");
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedIdx(null);
      setIsSubmitted(false);
    } else {
      setShowSummary(true);
      const isPerfect = correctCount + (selectedIdx === currentQuestion.correctIndex ? 1 : 0) === questions.length;
      if (isPerfect) {
        playQuizChime("perfect");
        onXpGain(50, t.xp_reason_perfect);
      }
      onFinish(correctCount, questions.length);
    }
  };

  if (showSummary) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    let feedbackText = "";
    
    if (percentage === 100) {
      feedbackText = t.perfect_feedback;
    } else if (percentage >= 70) {
      feedbackText = t.good_feedback;
    } else {
      feedbackText = t.try_feedback;
    }

    return (
      <div className="bg-white rounded-3xl p-6 border border-natural-border shadow-sm text-center max-w-md mx-auto animate-fade-in" id="quiz-summary">
        <div className="flex justify-center mb-4">
          {percentage === 100 ? (
            <div className="w-20 h-20 bg-natural-yellow/40 text-natural-yellow-text rounded-full flex items-center justify-center border border-natural-yellow-dark/30 shadow-sm animate-bounce">
              <Trophy size={40} />
            </div>
          ) : (
            <div className="w-20 h-20 bg-natural-green/20 text-natural-green-text rounded-full flex items-center justify-center border border-natural-green-text/25 shadow-sm">
              <Award size={40} />
            </div>
          )}
        </div>

        <h3 className="font-sans font-black text-xl text-natural-dark mb-1">{t.completed_title}</h3>
        <p className="text-natural-gray text-xs mb-5 font-semibold">{t.topic_label} {lesson.title}</p>

        {/* Score Ring */}
        <div className="inline-block bg-natural-bg border border-natural-border rounded-2xl px-6 py-4 mb-5">
          <div className="text-3xl font-mono font-black text-[#445044]">
            {correctCount} / {questions.length}
          </div>
          <p className="text-[10px] text-natural-gray uppercase tracking-wider font-extrabold mt-1">
            {t.correct_answers.replace("{percentage}", percentage.toString())}
          </p>
        </div>

        <p className="text-sm font-bold text-natural-dark leading-relaxed mb-6 px-4">
          {feedbackText}
        </p>

        {/* XP breakdown */}
        <div className="bg-natural-green/30 border border-natural-green-text/15 p-3 rounded-2xl mb-6 text-xs text-natural-green-text font-black flex items-center justify-center gap-2">
          <span>{t.total_xp_earned.replace("{amount}", (correctCount * 20 + (percentage === 100 ? 50 : 0)).toString())}</span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full bg-[#445044] hover:bg-[#343e34] text-white py-3 px-4 rounded-xl text-xs font-bold transition shadow-sm"
          >
            {t.back_to_dashboard}
          </button>
          <button
            onClick={() => {
              setCurrentIdx(0);
              setSelectedIdx(null);
              setIsSubmitted(false);
              setCorrectCount(0);
              setShowSummary(false);
            }}
            className="w-full bg-white hover:bg-natural-bg border border-natural-border text-natural-gray py-3 px-4 rounded-xl text-xs font-bold transition"
          >
            {t.try_again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-natural-border shadow-sm p-5 max-w-lg mx-auto" id="quiz-runner">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <span className="text-[10px] font-black text-natural-gray uppercase tracking-wider block">{t.question_title}</span>
          <span className="font-mono text-xs font-bold text-natural-dark bg-natural-bg border border-natural-border px-2 py-0.5 rounded-full">
            {currentIdx + 1} / {questions.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold text-natural-gray hover:text-natural-dark transition"
        >
          {t.quit_btn}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-natural-border/40 h-1.5 rounded-full overflow-hidden mb-6">
        <div
          className="bg-[#445044] h-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="bg-natural-bg border border-natural-border rounded-2xl p-4 mb-6">
        <h4 className="font-sans font-black text-sm sm:text-base text-natural-dark leading-relaxed">
          {currentQuestion.question}
        </h4>
      </div>

      {/* Options Grid */}
      <div className="flex flex-col gap-2.5 mb-6">
        {currentQuestion.options.map((option, idx) => {
          let optionStyle = "border-natural-border bg-white text-natural-dark hover:border-natural-gray";
          let icon = null;

          if (isSubmitted) {
            const isCurrentCorrect = idx === currentQuestion.correctIndex;
            const isCurrentSelected = idx === selectedIdx;

            if (isCurrentCorrect) {
              optionStyle = "border-[#445044] bg-[#445044]/10 text-[#445044] font-bold";
              icon = <CheckCircle size={16} className="text-[#445044] shrink-0" />;
            } else if (isCurrentSelected) {
              optionStyle = "border-natural-orange bg-natural-orange/15 text-natural-orange-text font-bold";
              icon = <XCircle size={16} className="text-natural-orange shrink-0" />;
            } else {
              optionStyle = "border-natural-border/30 bg-white text-natural-gray opacity-50";
            }
          } else if (selectedIdx === idx) {
            optionStyle = "border-natural-yellow-dark bg-natural-yellow/25 text-natural-yellow-text font-bold ring-2 ring-natural-yellow/20";
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              disabled={isSubmitted}
              className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition flex justify-between items-center gap-3 ${optionStyle}`}
            >
              <span>{option}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Answer Explanations card */}
      {isSubmitted && (
        <div className="bg-natural-yellow/20 border border-natural-yellow-dark/25 rounded-2xl p-4 text-xs text-natural-dark leading-relaxed mb-6 animate-fade-in">
          <p className="font-black text-natural-yellow-text mb-1">{t.explanation_title}</p>
          <p className="font-medium">{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-end">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIdx === null}
            className="w-full bg-[#445044] hover:bg-[#343e34] text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.check_btn}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-natural-dark hover:bg-natural-dark/95 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
          >
            <span>{currentIdx < questions.length - 1 ? t.next_btn : t.finish_btn}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
