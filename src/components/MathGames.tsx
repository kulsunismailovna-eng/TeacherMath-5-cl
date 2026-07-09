import { useState, useEffect, useRef } from "react";
import { Zap, Clock, Pizza, RotateCcw, Trophy, Play, Gamepad2 } from "lucide-react";
import { UserProfile } from "../types";

// Reusable audio feedback
const playSound = (type: "correct" | "incorrect" | "timeUp" | "highScore") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (type === "correct") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "incorrect") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "timeUp") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === "highScore") {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.07 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.32);
      });
    }
  } catch (e) {
    console.warn("Audio blocked", e);
  }
};

const GAME_TRANSLATIONS = {
  kg: {
    games_title: "Математикалык Оюндар 🎮",
    games_sub: "Окууну кызыктуу оюн менен айкалыштырыңыз! Оюндарды ойноп, рекорддорду жаңыртыңыз жана кошумча XP упайларын топтоңуз.",
    sprint_title: "Сандар жарышы (Math Sprint)",
    sprint_desc: "60 секунддук ылдам эсептөө жарышы. Суроолорго тез жана туура жооп берип, рекордду жаңылаңыз!",
    high_score: "Рекорд:",
    play_btn: "Ойноо",
    pizza_title: "Пирог пайызы (Fraction Pizza)",
    pizza_desc: "Бөлчөккө ылайык келген туура боёлгон пирогду тандаңыз. Бөлчөктөрдү визуалдык кабыл алууну жакшыртыңыз!",
    points: "упай",
    // Sprint game screen
    sprint_intro: "Ар бир туура жоопко 1 упай кошулат. Эч кандай ката кетирбей тезирээк иштеп, жогорку комбого жетиңиз!",
    sprint_best: "Сиздин эң мыкты рекорд:",
    back_btn: "Кайтуу",
    start_btn: "Баштоо! 🚀",
    seconds_label: "секунд",
    score_label: "Упай:",
    example_label: "Мисал",
    quit_confirm: "Оюнду токтотууну каалайсызбы?",
    quit_btn: "Оюнду токтотуу ✕",
    game_over: "Оюн Аяктады!",
    sprint_over_desc: "Жарыш аяктады! Сиздин упайыңыз:",
    points_gained: "упай топтолду",
    new_record: "🎉 ЖАҢЫ РЕКОРД!",
    reward_label: "Сыйлык: +{amount} XP упайы! 🌟",
    back_to_menu: "Оюндарга кайт",
    play_again: "Кайра ойноо",
    // Pizza game screen
    pizza_round: "Раунд: {current} / 5",
    pizza_score: "Упай: {score} XP",
    pizza_question: "Кайсы бөлчөк көрсөтүлгөн? 🍕",
    check_btn: "Текшерүү",
    next_question: "Кийинки суроо",
    finish_game: "Оюнду жыйынтыктоо",
    pizza_over: "Керемет оюн болду!",
    pizza_over_desc: "Бөлчөк пирогдорун дал келтирүү аяктады! Сиздин жыйынтык:",
    pizza_correct: "туура дал келтирилди",
  },
  ru: {
    games_title: "Математические Игры 🎮",
    games_sub: "Совмещайте учебу с веселыми играми! Играйте в игры, бейте рекорды и зарабатывайте дополнительные очки XP.",
    sprint_title: "Гонка чисел (Math Sprint)",
    sprint_desc: "60-секундная гонка на быстрый счет. Отвечайте быстро и правильно, побейте свой рекорд!",
    high_score: "Рекорд:",
    play_btn: "Играть",
    pizza_title: "Пирог долей (Fraction Pizza)",
    pizza_desc: "Выберите дробь, которая соответствует закрашенному пирогу. Улучшите визуальное восприятие дробей!",
    points: "очков",
    // Sprint game screen
    sprint_intro: "За каждый правильный ответ вы получаете 1 очко. Считайте быстро без ошибок и набирайте горячее комбо!",
    sprint_best: "Ваш лучший рекорд:",
    back_btn: "Назад",
    start_btn: "Начать! 🚀",
    seconds_label: "секунд",
    score_label: "Счёт:",
    example_label: "Пример",
    quit_confirm: "Вы действительно хотите выйти из игры?",
    quit_btn: "Остановить игру ✕",
    game_over: "Игра Окончена!",
    sprint_over_desc: "Время вышло! Ваш результат:",
    points_gained: "очков набрано",
    new_record: "🎉 НОВЫЙ РЕКОРД!",
    reward_label: "Награда: +{amount} XP! 🌟",
    back_to_menu: "Вернуться к играм",
    play_again: "Играть снова",
    // Pizza game screen
    pizza_round: "Раунд: {current} / 5",
    pizza_score: "Счёт: {score} XP",
    pizza_question: "Какая дробь показана? 🍕",
    check_btn: "Проверить",
    next_question: "Следующий вопрос",
    finish_game: "Завершить игру",
    pizza_over: "Отличная игра!",
    pizza_over_desc: "Сопоставление долей пирога завершено! Ваш результат:",
    pizza_correct: "правильно найдено",
  }
};

interface MathGamesProps {
  userProfile: UserProfile;
  onXpGain: (amount: number, reason: string) => void;
  onUpdateHighScore: (score: number) => void;
}

export default function MathGames({ userProfile, onXpGain, onUpdateHighScore }: MathGamesProps) {
  const [activeGame, setActiveGame] = useState<"menu" | "sprint" | "matcher">("menu");
  const lang = userProfile.language || "kg";
  const t = GAME_TRANSLATIONS[lang] || GAME_TRANSLATIONS.kg;

  return (
    <div className="flex flex-col h-full bg-natural-bg rounded-2xl overflow-hidden border border-natural-border shadow-sm" id="math-games">
      {/* Title block */}
      <div className="bg-[#445044] p-4 text-natural-bg text-center flex items-center justify-center gap-2 border-b border-[#526052]">
        <Gamepad2 size={20} />
        <h2 className="font-sans font-extrabold text-sm sm:text-base">{t.games_title}</h2>
      </div>

      {activeGame === "menu" && (
        <div className="flex-1 p-5 space-y-4 max-h-[500px] overflow-y-auto">
          <p className="text-xs text-natural-gray text-center leading-relaxed font-medium">
            {t.games_sub}
          </p>

          {/* Game 1: Sprint */}
          <div className="bg-white border border-natural-border rounded-2xl p-4 shadow-sm hover:border-natural-yellow-dark transition flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-natural-orange/20 text-natural-orange-text flex items-center justify-center text-xl shrink-0 border border-natural-orange/30">
                ⚡
              </div>
              <div>
                <h3 className="font-sans font-extrabold text-xs sm:text-sm text-natural-dark">{t.sprint_title}</h3>
                <p className="text-[10px] text-natural-gray mt-0.5 leading-relaxed">
                  {t.sprint_desc}
                </p>
                {userProfile.solvedCount !== undefined && (
                  <span className="text-[9px] font-bold text-natural-orange-text bg-natural-orange/20 border border-natural-orange/40 px-2 py-0.5 rounded mt-2 inline-block">
                    {t.high_score} {userProfile.solvedCount || 0} {t.points}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setActiveGame("sprint");
                playSound("correct");
              }}
              className="bg-natural-orange hover:bg-natural-orange/95 text-natural-orange-text border border-natural-orange-text/20 p-2.5 rounded-xl text-xs font-bold transition shrink-0 shadow-sm"
            >
              {t.play_btn}
            </button>
          </div>

          {/* Game 2: Matcher */}
          <div className="bg-white border border-natural-border rounded-2xl p-4 shadow-sm hover:border-natural-yellow-dark transition flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-natural-yellow/40 text-natural-yellow-text flex items-center justify-center text-xl shrink-0 border border-natural-yellow-dark/30">
                🍕
              </div>
              <div>
                <h3 className="font-sans font-extrabold text-xs sm:text-sm text-natural-dark">{t.pizza_title}</h3>
                <p className="text-[10px] text-natural-gray mt-0.5 leading-relaxed">
                  {t.pizza_desc}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveGame("matcher");
                playSound("correct");
              }}
              className="bg-natural-yellow hover:bg-natural-yellow-dark/10 text-natural-yellow-text border border-natural-yellow-dark/40 p-2.5 rounded-xl text-xs font-bold transition shrink-0 shadow-sm"
            >
              {t.play_btn}
            </button>
          </div>
        </div>
      )}

      {activeGame === "sprint" && (
        <MathSprintGame
          onXpGain={onXpGain}
          onUpdateHighScore={onUpdateHighScore}
          highScore={userProfile.solvedCount || 0}
          onBack={() => setActiveGame("menu")}
          lang={lang}
        />
      )}

      {activeGame === "matcher" && (
        <FractionPizzaMatcherGame
          onXpGain={onXpGain}
          onBack={() => setActiveGame("menu")}
          lang={lang}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   MATH SPRINT MINI-GAME COMPONENT
   ========================================================================== */
interface MathSprintProps {
  onXpGain: (amount: number, reason: string) => void;
  onUpdateHighScore: (score: number) => void;
  highScore: number;
  onBack: () => void;
  lang: string;
}

function MathSprintGame({ onXpGain, onUpdateHighScore, highScore, onBack, lang }: MathSprintProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [question, setQuestion] = useState({ text: "", answer: 0, options: [0] });
  const [gameState, setGameState] = useState<"ready" | "playing" | "over">("ready");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const t = GAME_TRANSLATIONS[lang] || GAME_TRANSLATIONS.kg;

  // Generate a random 5th grade math question
  const generateQuestion = () => {
    const types = ["+", "-", "*", "/"];
    const type = types[Math.floor(Math.random() * types.length)];
    let num1 = 0;
    let num2 = 0;
    let text = "";
    let answer = 0;

    if (type === "+") {
      num1 = Math.floor(Math.random() * 80) + 10;
      num2 = Math.floor(Math.random() * 80) + 10;
      text = `${num1} + ${num2}`;
      answer = num1 + num2;
    } else if (type === "-") {
      num1 = Math.floor(Math.random() * 80) + 20;
      num2 = Math.floor(Math.random() * (num1 - 5)) + 5;
      text = `${num1} - ${num2}`;
      answer = num1 - num2;
    } else if (type === "*") {
      num1 = Math.floor(Math.random() * 12) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      text = `${num1} × ${num2}`;
      answer = num1 * num2;
    } else { // /
      num2 = Math.floor(Math.random() * 10) + 2;
      answer = Math.floor(Math.random() * 10) + 2;
      num1 = num2 * answer;
      text = `${num1} ÷ ${num2}`;
    }

    // Generate options
    const options = new Set<number>();
    options.add(answer);
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 16) - 8;
      if (offset !== 0 && answer + offset > 0) {
        options.add(answer + offset);
      }
    }

    setQuestion({
      text,
      answer,
      options: Array.from(options).sort(() => Math.random() - 0.5),
    });
  };

  const handleStart = () => {
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setGameState("playing");
    generateQuestion();
    playSound("correct");
  };

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState("over");
            playSound("timeUp");
            // Award XP based on score
            const xpGained = score * 3;
            onXpGain(xpGained, lang === "ru" 
              ? `Ты заработал ${score} баллов в гонке чисел!` 
              : `Сандар жарышында ${score} упай алдың!`
            );
            if (score > highScore) {
              onUpdateHighScore(score);
              playSound("highScore");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, score]);

  const handleAnswer = (selected: number) => {
    if (selected === question.answer) {
      setScore((prev) => prev + 1);
      setCombo((prev) => prev + 1);
      playSound("correct");
      generateQuestion();
    } else {
      setCombo(0);
      playSound("incorrect");
      generateQuestion();
    }
  };

  return (
    <div className="flex-1 p-5 flex flex-col justify-between" id="math-sprint">
      {gameState === "ready" && (
        <div className="text-center py-10 space-y-6 max-w-xs mx-auto animate-fade-in">
          <div className="w-16 h-16 bg-natural-orange/20 border border-natural-orange/40 text-natural-orange-text rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
            ⚡
          </div>
          <div>
            <h3 className="font-sans font-black text-natural-dark text-base">{t.sprint_title}</h3>
            <p className="text-xs text-natural-gray mt-1 leading-relaxed font-medium">
              {t.sprint_intro}
            </p>
          </div>
          {highScore > 0 && (
            <div className="bg-white border border-natural-border rounded-xl p-2.5 text-xs text-natural-gray font-mono font-semibold">
              🏁 {t.sprint_best} <span className="font-bold text-natural-orange-text">{highScore}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 border border-natural-border hover:bg-white py-3 rounded-xl text-xs font-bold text-natural-gray transition"
            >
              {t.back_btn}
            </button>
            <button
              onClick={handleStart}
              className="flex-1 bg-natural-orange hover:bg-natural-orange/90 text-natural-orange-text border border-natural-orange-text/20 font-bold py-3 rounded-xl text-xs transition shadow-sm"
            >
              {t.start_btn}
            </button>
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <div className="space-y-6 animate-fade-in">
          {/* Game stats panel */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-natural-dark font-bold bg-white border border-natural-border px-2.5 py-1 rounded-full font-mono">
              <Clock size={14} className="text-natural-orange" />
              <span>{timeLeft} {t.seconds_label}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-sans font-bold text-natural-gray text-[10px] uppercase">{t.score_label}</span>
              <span className="font-mono text-xs font-black text-natural-orange-text bg-natural-orange/20 border border-natural-orange/30 px-3 py-0.5 rounded-full">
                {score}
              </span>
            </div>
          </div>

          {/* Combo indicator */}
          {combo > 2 && (
            <div className="text-center animate-bounce">
              <span className="bg-natural-yellow border border-natural-yellow-dark text-natural-yellow-text text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                🔥 COMBO ×{combo}!
              </span>
            </div>
          )}

          {/* Mathematical formulation */}
          <div className="bg-white border border-natural-border rounded-3xl p-8 shadow-sm text-center">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-natural-gray">{t.example_label}</span>
            <div className="text-4xl font-mono font-black text-natural-dark tracking-tight mt-1">
              {question.text}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className="bg-white border border-natural-border hover:border-natural-orange hover:bg-natural-orange/10 active:bg-natural-orange/20 py-4 px-3 rounded-2xl text-base font-mono font-black text-natural-dark transition shadow-sm active:scale-95"
              >
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (confirm(t.quit_confirm)) {
                setGameState("ready");
                if (timerRef.current) clearInterval(timerRef.current);
              }
            }}
            className="w-full border border-natural-border text-natural-gray hover:text-natural-dark py-2.5 rounded-xl text-xs font-bold transition"
          >
            {t.quit_btn}
          </button>
        </div>
      )}

      {gameState === "over" && (
        <div className="text-center py-10 space-y-6 max-w-xs mx-auto animate-fade-in">
          <div className="w-16 h-16 bg-natural-yellow/40 text-natural-yellow-text border border-natural-yellow-dark rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
            🏆
          </div>
          <div>
            <h3 className="font-sans font-black text-natural-dark text-base">{t.game_over}</h3>
            <p className="text-xs text-natural-gray mt-1 leading-relaxed font-medium">
              {t.sprint_over_desc}
            </p>
          </div>

          <div className="bg-white border border-natural-border rounded-2xl p-4">
            <div className="text-4xl font-mono font-black text-natural-orange-text">{score}</div>
            <p className="text-[9px] font-bold text-natural-gray uppercase mt-1">{t.points_gained}</p>
            {score > highScore && (
              <p className="text-[10px] font-black text-[#445044] mt-2">{t.new_record}</p>
            )}
          </div>

          <div className="bg-natural-green/40 border border-natural-green-text/20 p-2.5 rounded-xl text-xs font-bold text-natural-green-text font-sans">
            {t.reward_label.replace("{amount}", (score * 3).toString())}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 border border-natural-border hover:bg-white py-3 rounded-xl text-xs font-bold text-natural-gray transition"
            >
              {t.back_to_menu}
            </button>
            <button
              onClick={handleStart}
              className="flex-1 bg-natural-orange hover:bg-natural-orange/90 text-natural-orange-text border border-natural-orange-text/20 font-bold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>{t.play_again}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   FRACTION PIZZA MATCHER MINI-GAME COMPONENT
   ========================================================================== */
interface FractionPizzaProps {
  onXpGain: (amount: number, reason: string) => void;
  onBack: () => void;
  lang: string;
}

interface MatcherQuestion {
  numerator: number;
  denominator: number;
  options: { num: number; den: number }[]; // options of fractions
}

function FractionPizzaMatcherGame({ onXpGain, onBack, lang }: FractionPizzaProps) {
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(1); // Track current round
  const [currentQ, setCurrentQ] = useState<MatcherQuestion | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const t = GAME_TRANSLATIONS[lang] || GAME_TRANSLATIONS.kg;

  // Generate an SVG fraction circle based on parameters
  const renderFractionSvg = (num: number, den: number, scale = "w-16 h-16") => {
    const baseAngle = 360 / den;
    const slices = [];
    
    for (let i = 0; i < den; i++) {
      const startAngle = i * baseAngle - 90;
      const endAngle = (i + 1) * baseAngle - 90;
      
      const radStart = (startAngle * Math.PI) / 180;
      const radEnd = (endAngle * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(radStart);
      const y1 = 50 + 40 * Math.sin(radStart);
      const x2 = 50 + 40 * Math.cos(radEnd);
      const y2 = 50 + 40 * Math.sin(radEnd);

      const largeArcFlag = baseAngle > 180 ? 1 : 0;
      const pathData = `
        M 50 50
        L ${x1} ${y1}
        A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;
      const isSelected = i < num;
      slices.push({ pathData, isSelected });
    }

    return (
      <svg viewBox="0 0 100 100" className={`${scale} drop-shadow-sm`}>
        <circle cx="50" cy="50" r="42" fill="#FAF7F2" stroke="#E8E2D9" strokeWidth="1.5" />
        {slices.map((slice, idx) => (
          <path
            key={idx}
            d={slice.pathData}
            fill={slice.isSelected ? "#7A702E" : "#FAF7F2"}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        ))}
        <circle cx="50" cy="50" r="4" fill="#ffffff" />
      </svg>
    );
  };

  // Generate a random fraction puzzle
  const generateMatcherQ = () => {
    const denoms = [3, 4, 5, 6, 8, 10];
    const denominator = denoms[Math.floor(Math.random() * denoms.length)];
    const numerator = Math.floor(Math.random() * (denominator - 1)) + 1;

    // Generate fractions as options
    const optionsSet = new Set<string>();
    optionsSet.add(`${numerator}/${denominator}`);

    while (optionsSet.size < 4) {
      const d = denoms[Math.floor(Math.random() * denoms.length)];
      const n = Math.floor(Math.random() * (d - 1)) + 1;
      optionsSet.add(`${n}/${d}`);
    }

    const options = Array.from(optionsSet).map((str) => {
      const [num, den] = str.split("/").map(Number);
      return { num, den };
    }).sort(() => Math.random() - 0.5);

    setCurrentQ({
      numerator,
      denominator,
      options,
    });
    setSelectedIdx(null);
    setIsSubmitted(false);
  };

  useEffect(() => {
    generateMatcherQ();
  }, []);

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIdx(idx);
  };

  const handleCheck = () => {
    if (selectedIdx === null || !currentQ || isSubmitted) return;

    setIsSubmitted(true);
    const selected = currentQ.options[selectedIdx];
    const isCorrect = selected.num === currentQ.numerator && selected.den === currentQ.denominator;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setScore((prev) => prev + 10);
      playSound("correct");
    } else {
      playSound("incorrect");
    }
  };

  const handleNext = () => {
    if (currentIdx < 5) {
      setCurrentIdx((prev) => prev + 1);
      generateMatcherQ();
    } else {
      setIsGameOver(true);
      playSound("highScore");
      const totalXP = correctCount * 15;
      onXpGain(totalXP, lang === "ru" 
        ? `Ты угадал ${correctCount} пирогов в сопоставлении дробей!` 
        : `Бөлчөк пирогун дал келтирүүдөн ${correctCount} туура жооп бердиң!`
      );
    }
  };

  const handleRestart = () => {
    setCorrectCount(0);
    setScore(0);
    setCurrentIdx(1);
    setIsGameOver(false);
    generateMatcherQ();
  };

  if (!currentQ) return null;

  return (
    <div className="flex-1 p-5 flex flex-col justify-between" id="fraction-matcher">
      {!isGameOver ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono bg-natural-yellow/35 border border-natural-yellow-dark/20 text-natural-yellow-text px-2.5 py-0.5 rounded-full font-bold">
              {t.pizza_round.replace("{current}", currentIdx.toString())}
            </span>
            <span className="font-mono bg-white border border-natural-border text-natural-dark px-2.5 py-0.5 rounded-full font-bold">
              {t.pizza_score.replace("{score}", score.toString())}
            </span>
          </div>

          {/* Main Visual Center: A fraction representation */}
          <div className="bg-white border border-natural-border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center space-y-4">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#445044]">
              {t.pizza_question}
            </span>
            {renderFractionSvg(currentQ.numerator, currentQ.denominator, "w-36 h-36")}
          </div>

          {/* Choices: Simple Fraction Blocks */}
          <div className="grid grid-cols-2 gap-3">
            {currentQ.options.map((option, idx) => {
              const isCorrectOpt = option.num === currentQ.numerator && option.den === currentQ.denominator;
              let btnStyle = "border-natural-border bg-white text-natural-dark hover:border-natural-yellow-dark";

              if (isSubmitted) {
                if (isCorrectOpt) {
                  btnStyle = "border-[#445044] bg-[#445044]/10 text-[#445044] font-bold";
                } else if (selectedIdx === idx) {
                  btnStyle = "border-natural-orange bg-natural-orange/15 text-natural-orange-text font-bold";
                } else {
                  btnStyle = "border-natural-border/30 bg-white text-natural-gray opacity-50";
                }
              } else if (selectedIdx === idx) {
                btnStyle = "border-natural-yellow-dark bg-natural-yellow/25 text-natural-yellow-text font-bold ring-2 ring-natural-yellow/20";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isSubmitted}
                  className={`py-4 px-3 rounded-2xl border flex flex-col items-center justify-center transition active:scale-95 ${btnStyle}`}
                >
                  <span className="text-xl font-mono font-extrabold">{option.num}</span>
                  <div className="w-6 h-0.5 bg-current my-0.5"></div>
                  <span className="text-sm font-mono font-bold">{option.den}</span>
                </button>
              );
            })}
          </div>

          {/* Action button */}
          <div className="flex justify-end gap-2">
            {!isSubmitted ? (
              <button
                onClick={handleCheck}
                disabled={selectedIdx === null}
                className="w-full bg-[#445044] hover:bg-[#343e34] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold transition shadow-sm"
              >
                {t.check_btn}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full bg-natural-dark hover:bg-natural-dark/95 text-white py-3 rounded-xl text-xs font-bold transition shadow-sm"
              >
                {currentIdx < 5 ? t.next_question : t.finish_game}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 space-y-6 max-w-xs mx-auto animate-fade-in" id="fraction-game-over">
          <div className="w-16 h-16 bg-natural-yellow/40 text-natural-yellow-text border border-natural-yellow-dark rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
            🍕
          </div>
          <div>
            <h3 className="font-sans font-black text-natural-dark text-base">{t.pizza_over}</h3>
            <p className="text-xs text-natural-gray mt-1 leading-relaxed font-medium">
              {t.pizza_over_desc}
            </p>
          </div>

          <div className="bg-white border border-natural-border rounded-2xl p-4">
            <div className="text-4xl font-mono font-black text-natural-yellow-text">{correctCount} / 5</div>
            <p className="text-[9px] font-bold text-natural-gray uppercase mt-1">{t.pizza_correct}</p>
          </div>

          <div className="bg-natural-green/40 border border-natural-green-text/20 p-2.5 rounded-xl text-xs font-bold text-natural-green-text">
            {t.reward_label.replace("{amount}", (correctCount * 15).toString())}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 border border-natural-border hover:bg-white py-3 rounded-xl text-xs font-bold text-natural-gray transition"
            >
              {t.back_to_menu}
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 bg-natural-yellow hover:bg-natural-yellow-dark text-natural-yellow-text border border-natural-yellow-dark/20 font-bold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>{t.play_again}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
