import { useState, useEffect } from "react";
import { Plus, Minus, Scale } from "lucide-react";

// Helper sound synthesizer using Web Audio API for rewarding sounds
const playChime = (type: "success" | "click" | "levelUp") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "success") {
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.22);
      });
    }
  } catch (e) {
    console.warn("Web Audio not supported or blocked", e);
  }
};

interface WidgetProps {
  onSuccess?: () => void;
  lang?: "kg" | "ru";
}

const WIDGET_TRANSLATIONS = {
  kg: {
    rounding_title: "Санды тегеректөө машинасы ⚙️",
    rounding_sub: "Санды өзгөртүү үчүн төмөнкү сызгычты жылдырыңыз жана тегеректөө деңгээлин тандаңыз.",
    number: "Сан:",
    round_tens: "Ондуктарга чейин",
    round_hundreds: "Жүздүктөргө чейин",
    hundreds: "жүзд.",
    tens: "онд.",
    ones: "бирдик.",
    arrow_pointer: "⬇️ тегеректөө ⬇️",
    how_to_solve: "Кантип чыгарылат?",
    understood_btn: "Чыгарылышын түшүндүм! 👍 (+10 XP)",
    fraction_title: "Интерактивдүү бөлчөк куралы 🍕",
    fraction_sub: "Алым менен Бөлүмдү өзгөртүп, бөлчөктөрдүн визуалдык көрүнүшүн байкаңыз!",
    numerator: "Алымы (Numerator)",
    numerator_sub: '"Канча тең бөлүк алынды"',
    denominator: "Бөлүмү (Denominator)",
    denominator_sub: '"Бардыгы канча бөлүк"',
    fraction_proper: "Дурус бөлчөк",
    fraction_equal_one: "Бир бүтүн",
    fraction_improper: "Буруш бөлчөк",
    proper_desc: "Алымы бөлүмүнөн кичине. Бул 1ден кичине сан.",
    equal_one_desc: "Бүтүн нерсе толугу менен алынды! 1ге барабар.",
    fraction_understood: "Бөлчөктөрдү түшүндүм! 😋 (+10 XP)",
    decimals_title: "Ондук бөлчөк окуу уюлдугу 🔢",
    decimals_sub: "Слайдерди жылдырып, ондук бөлчөктөрдүн разряддарын жана кыргызча окулушун билип алыңыз!",
    decimals_table: "Разряддык Таблица",
    decimals_ones: "Бирдиктер",
    decimals_comma: "Үтүр",
    decimals_tenths: "Ондон бир",
    decimals_hundreds: "Жүздөн бир",
    decimals_life_example_title: "Турмуштан мисал:",
    decimals_life_example_desc: "1,50 сом бул 1 сом жана 50 тыйын дегенди билдирет. Биз аны ондук бөлчөктө 1,5 сом же 1,50 сом деп жазабыз.",
    decimals_understood: "Ондук бөлчөктөрдү түшүндүм! 💎 (+10 XP)",
    equation_title: "Тараза теңдемеси ⚖️",
    equation_sub: "Тараза тең салмактуулукта турушу үчүн x тамгасынын ордунда кайсы сан турушу керек?",
    left: "Сол",
    right: "Оң",
    adjust_scale: "⚙️ Таразаны өзгөртүү:",
    adjust_left: "Сол жак кошумча",
    adjust_right: "Оң жак салмак",
    equation_label: "Теңдеме:",
    equation_guess: "x-ти табуу үчүн кандай сан жазышыбыз керек?",
    geometry_title: "Тик бурчтук куруучу аянт 📐",
    geometry_sub: "Жактарын өзгөртүп, анын ичиндеги квадраттарды санап көрүңүз! 1 чарчы тор куту = 1 см².",
    length: "Узундугу (a)",
    width: "Туурасы (b)",
    area_label: "Аянты (S = a × b)",
    perimeter_label: "Периметри (P = 2(a+b))",
    geometry_understood: "Аянттарды түшүндүм! 📐 (+10 XP)",
    scale_label: "ТЕҢДЕМЕ ТАРАЗАСЫ",
  },
  ru: {
    rounding_title: "Машина округления чисел ⚙️",
    rounding_sub: "Передвигайте ползунок для изменения числа и выберите уровень округления.",
    number: "Число:",
    round_tens: "До десятков",
    round_hundreds: "До сотен",
    hundreds: "сот.",
    tens: "дес.",
    ones: "ед.",
    arrow_pointer: "⬇️ округление ⬇️",
    how_to_solve: "Как это решается?",
    understood_btn: "Я понял решение! 👍 (+10 XP)",
    fraction_title: "Интерактивные дроби 🍕",
    fraction_sub: "Меняйте числитель и знаменатель, чтобы увидеть визуальное представление дроби!",
    numerator: "Числитель (Numerator)",
    numerator_sub: '"Сколько частей взяли"',
    denominator: "Знаменатель (Denominator)",
    denominator_sub: '"На сколько частей разделили"',
    fraction_proper: "Правильная дробь",
    fraction_equal_one: "Одна целая",
    fraction_improper: "Неправильная дробь",
    proper_desc: "Числитель меньше знаменателя. Это число меньше 1.",
    equal_one_desc: "Взяты все части целого! Дробь равна 1.",
    fraction_understood: "Я понял дроби! 😋 (+10 XP)",
    decimals_title: "Чтение десятичных дробей 🔢",
    decimals_sub: "Двигайте ползунок, чтобы узнать разряды десятичной дроби и их правильное чтение!",
    decimals_table: "Таблица Разрядов",
    decimals_ones: "Единицы",
    decimals_comma: "Запятая",
    decimals_tenths: "Десятые",
    decimals_hundreds: "Сотые",
    decimals_life_example_title: "Пример из жизни:",
    decimals_life_example_desc: "1,50 сома означает 1 сом и 50 тыйынов. В виде десятичной дроби мы пишем 1,5 сома или 1,50 сома.",
    decimals_understood: "Я понял десятичные дроби! 💎 (+10 XP)",
    equation_title: "Весы уравнений ⚖️",
    equation_sub: "Какое число должно быть на месте x, чтобы весы были в равновесии?",
    left: "Лево",
    right: "Право",
    adjust_scale: "⚙️ Изменение весов:",
    adjust_left: "Добавка слева",
    adjust_right: "Вес справа",
    equation_label: "Уравнение:",
    equation_guess: "Какое число подставить вместо x?",
    geometry_title: "Площадь прямоугольника 📐",
    geometry_sub: "Меняйте стороны и считайте квадраты внутри прямоугольника! 1 клетка = 1 см².",
    length: "Длина (a)",
    width: "Ширина (b)",
    area_label: "Площадь (S = a × b)",
    perimeter_label: "Периметр (P = 2(a+b))",
    geometry_understood: "Я понял площадь и периметр! 📐 (+10 XP)",
    scale_label: "ВЕСЫ УРАВНЕНИЙ",
  }
};

// 1. ROUNDING WIDGET
export function RoundingWidget({ onSuccess, lang = "kg" }: WidgetProps) {
  const [number, setNumber] = useState<number>(347);
  const [roundTo, setRoundTo] = useState<"tens" | "hundreds">("tens");

  const t = WIDGET_TRANSLATIONS[lang] || WIDGET_TRANSLATIONS.kg;
  const digits = number.toString().padStart(3, "0").split("");
  
  const unitsDigit = number % 10;
  const tensDigit = Math.floor((number % 100) / 10);
  const hundredsDigit = Math.floor(number / 100);

  let rounded = number;
  let ruleText = "";
  let isUp = false;

  if (roundTo === "tens") {
    isUp = unitsDigit >= 5;
    rounded = Math.round(number / 10) * 10;
    if (lang === "ru") {
      ruleText = `Следующая цифра справа — ${unitsDigit}. Она ${isUp ? "больше или равна 5 (5,6,7,8,9)" : "меньше 5 (0,1,2,3,4)"}, поэтому цифра в разряде десятков (${tensDigit}) ${isUp ? "увеличивается на 1" : "не меняется"}, а все цифры после неё заменяются нулями.`;
    } else {
      ruleText = `Оң жактагы кийинки сан — ${unitsDigit}. Ал ${isUp ? "5ке барабар же чоң (5,6,7,8,9)" : "5тен кичине (0,1,2,3,4)"}, ошондуктан ондуктардагы сан (${tensDigit}) ${isUp ? "1ге көбөйөт" : "өзгөрбөйт"}, андан кийинки сан 0 болот.`;
    }
  } else {
    isUp = tensDigit >= 5;
    rounded = Math.round(number / 100) * 100;
    if (lang === "ru") {
      ruleText = `Следующая цифра справа — ${tensDigit}. Она ${isUp ? "больше или равна 5 (5,6,7,8,9)" : "меньше 5 (0,1,2,3,4)"}, поэтому цифра в разряде сотен (${hundredsDigit}) ${isUp ? "увеличивается на 1" : "не меняется"}, а все последующие цифры справа заменяются нулями.`;
    } else {
      ruleText = `Оң жактагы кийинки сан — ${tensDigit}. Ал ${isUp ? "5ке барабар же чоң (5,6,7,8,9)" : "5тен кичине (0,1,2,3,4)"}, ошондуктан жүздүктөрдөгү сан (${hundredsDigit}) ${isUp ? "1ге көбөйөт" : "өзгөрбөйт"}, калган бардык оң жактагы сандар 0 болот.`;
    }
  }

  const handleTestRounding = () => {
    if (onSuccess) {
      playChime("success");
      onSuccess();
    } else {
      playChime("click");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-natural-border shadow-sm" id="rounding-widget">
      <h4 className="font-sans font-extrabold text-natural-dark mb-1 text-center text-sm sm:text-base">
        {t.rounding_title}
      </h4>
      <p className="text-xs text-natural-gray mb-4 text-center font-medium">
        {t.rounding_sub}
      </p>

      {/* Inputs */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex justify-between items-center bg-natural-bg p-3 rounded-xl border border-natural-border">
          <span className="text-xs font-bold text-natural-dark">{t.number}</span>
          <span className="text-xl font-mono font-black text-natural-orange-text">{number}</span>
        </div>
        <input
          type="range"
          min="10"
          max="999"
          value={number}
          onChange={(e) => {
            setNumber(parseInt(e.target.value));
            playChime("click");
          }}
          className="w-full h-2 bg-natural-border rounded-lg appearance-none cursor-pointer accent-[#E9B384]"
        />

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => {
              setRoundTo("tens");
              playChime("click");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
              roundTo === "tens"
                ? "bg-natural-orange/15 border-natural-orange/40 text-natural-orange-text"
                : "bg-white border-natural-border text-natural-gray hover:bg-natural-bg"
            }`}
          >
            {t.round_tens}
          </button>
          <button
            onClick={() => {
              setRoundTo("hundreds");
              playChime("click");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
              roundTo === "hundreds"
                ? "bg-natural-orange/15 border-natural-orange/40 text-natural-orange-text"
                : "bg-white border-natural-border text-natural-gray hover:bg-natural-bg"
            }`}
          >
            {t.round_hundreds}
          </button>
        </div>
      </div>

      {/* Step by step visualization */}
      <div className="bg-natural-bg rounded-xl p-4 border border-natural-border mb-4">
        <div className="flex justify-center items-center gap-4 text-3xl font-bold font-mono mb-3">
          {digits.map((digit, idx) => {
            const isTarget =
              (roundTo === "tens" && idx === 1) || (roundTo === "hundreds" && idx === 0);
            const isIndicator =
              (roundTo === "tens" && idx === 2) || (roundTo === "hundreds" && idx === 1);

            return (
              <div key={idx} className="flex flex-col items-center">
                <span
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    isTarget
                      ? "bg-natural-orange/20 text-natural-orange-text border border-natural-orange/40 shadow-sm"
                      : isIndicator
                      ? "bg-natural-yellow/40 text-natural-yellow-text border border-natural-yellow-dark/40"
                      : "text-natural-dark"
                  }`}
                >
                  {digit}
                </span>
                <span className="text-[9px] font-sans font-bold text-natural-gray mt-1">
                  {idx === 0 ? t.hundreds : idx === 1 ? t.tens : t.ones}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center text-natural-gray text-xs font-bold mb-2">{t.arrow_pointer}</div>

        <div className="text-center text-2xl font-mono font-black text-natural-green-text bg-natural-green/20 py-2 rounded-lg border border-natural-green-text/25">
          {rounded}
        </div>
      </div>

      {/* Rule Explain */}
      <div className="bg-white rounded-xl p-3 border border-natural-border text-xs text-natural-dark leading-relaxed">
        <p className="font-extrabold text-natural-orange-text mb-1">{t.how_to_solve}</p>
        <p className="font-medium text-natural-dark">{ruleText}</p>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={handleTestRounding}
          className="w-full bg-[#445044] hover:bg-[#343e34] text-white py-3 px-4 rounded-xl text-xs font-bold transition shadow-sm"
        >
          {t.understood_btn}
        </button>
      </div>
    </div>
  );
}

// 2. FRACTION PIE & BAR WIDGET
export function FractionWidget({ onSuccess, lang = "kg" }: WidgetProps) {
  const [numerator, setNumerator] = useState<number>(3);
  const [denominator, setDenominator] = useState<number>(4);

  const t = WIDGET_TRANSLATIONS[lang] || WIDGET_TRANSLATIONS.kg;

  useEffect(() => {
    if (numerator > denominator * 2) {
      setNumerator(denominator * 2);
    }
  }, [denominator]);

  const isProper = numerator < denominator;
  const isEqualsOne = numerator === denominator;
  const isImproper = numerator > denominator;

  const slices = [];
  const baseAngle = 360 / denominator;
  
  for (let i = 0; i < denominator; i++) {
    const startAngle = i * baseAngle - 90;
    const endAngle = (i + 1) * baseAngle - 90;
    
    const radStart = (startAngle * Math.PI) / 180;
    const radEnd = (endAngle * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(radStart);
    const y1 = 50 + 40 * Math.sin(radStart);
    const x2 = 50 + 40 * Math.cos(radEnd);
    const y2 = 50 + 40 * Math.sin(radEnd);

    const largeArcFlag = baseAngle > 180 ? 1 : 0;
    const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    const isSelected = i < numerator;
    slices.push({ pathData, isSelected });
  }

  const extraSlices = [];
  if (isImproper) {
    const extraNumerator = numerator - denominator;
    for (let i = 0; i < denominator; i++) {
      const startAngle = i * baseAngle - 90;
      const endAngle = (i + 1) * baseAngle - 90;
      
      const radStart = (startAngle * Math.PI) / 180;
      const radEnd = (endAngle * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(radStart);
      const y1 = 50 + 40 * Math.sin(radStart);
      const x2 = 50 + 40 * Math.cos(radEnd);
      const y2 = 50 + 40 * Math.sin(radEnd);

      const largeArcFlag = baseAngle > 180 ? 1 : 0;
      const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      const isSelected = i < extraNumerator;
      extraSlices.push({ pathData, isSelected });
    }
  }

  const mixedWhole = Math.floor(numerator / denominator);
  const mixedRemainder = numerator % denominator;

  return (
    <div className="bg-white rounded-3xl p-5 border border-natural-border shadow-sm" id="fraction-widget">
      <h4 className="font-sans font-extrabold text-natural-dark mb-1 text-center text-sm sm:text-base">
        {t.fraction_title}
      </h4>
      <p className="text-xs text-natural-gray mb-4 text-center font-medium">
        {t.fraction_sub}
      </p>

      {/* Fraction Input Controls */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col items-center p-3 bg-natural-yellow/15 rounded-xl border border-natural-yellow-dark/30">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-natural-yellow-text mb-1 text-center">
            {t.numerator}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (numerator > 0) {
                  setNumerator(numerator - 1);
                  playChime("click");
                }
              }}
              className="p-1 rounded bg-white border border-natural-yellow-dark/30 text-natural-yellow-text hover:bg-natural-yellow/10 animate-hover"
            >
              <Minus size={14} />
            </button>
            <span className="text-lg font-mono font-black text-natural-yellow-text">{numerator}</span>
            <button
              onClick={() => {
                if (numerator < denominator * 2) {
                  setNumerator(numerator + 1);
                  playChime("click");
                }
              }}
              className="p-1 rounded bg-white border border-natural-yellow-dark/30 text-natural-yellow-text hover:bg-natural-yellow/10 animate-hover"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-[9px] text-natural-yellow-text/80 font-bold mt-1 text-center">{t.numerator_sub}</span>
        </div>

        <div className="flex flex-col items-center p-3 bg-natural-orange/15 rounded-xl border border-natural-orange/30">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-natural-orange-text mb-1 text-center">
            {t.denominator}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (denominator > 2) {
                  setDenominator(denominator - 1);
                  playChime("click");
                }
              }}
              className="p-1 rounded bg-white border border-natural-orange/30 text-natural-orange-text hover:bg-natural-orange/10 animate-hover"
            >
              <Minus size={14} />
            </button>
            <span className="text-lg font-mono font-black text-natural-orange-text">{denominator}</span>
            <button
              onClick={() => {
                if (denominator < 12) {
                  setDenominator(denominator + 1);
                  playChime("click");
                }
              }}
              className="p-1 rounded bg-white border border-natural-orange/30 text-natural-orange-text hover:bg-natural-orange/10 animate-hover"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-[9px] text-natural-orange-text/80 font-bold mt-1 text-center">{t.denominator_sub}</span>
        </div>
      </div>

      {/* Live Fraction Display */}
      <div className="flex flex-col items-center justify-center p-4 bg-natural-bg rounded-2xl border border-natural-border mb-4">
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-around">
          <div className="flex flex-col items-center font-mono text-2xl font-black bg-white px-5 py-3.5 rounded-2xl shadow-sm border border-natural-border shrink-0">
            <span className="text-natural-yellow-text">{numerator}</span>
            <div className="w-10 h-1 bg-natural-dark my-1 rounded-full"></div>
            <span className="text-natural-orange-text">{denominator}</span>
          </div>

          <div className="flex flex-col text-xs text-natural-dark gap-1.5 max-w-[210px]">
            <div className="flex gap-2 items-center">
              <span className={`w-3 h-3 rounded-full ${isProper ? "bg-natural-green" : isEqualsOne ? "bg-natural-yellow" : "bg-natural-orange"}`}></span>
              <span className="font-extrabold text-natural-dark">
                {isProper ? t.fraction_proper : isEqualsOne ? t.fraction_equal_one : t.fraction_improper}
              </span>
            </div>
            <p className="text-[10px] text-natural-gray font-medium leading-relaxed">
              {isProper && t.proper_desc}
              {isEqualsOne && t.equal_one_desc}
              {isImproper && (lang === "ru" 
                ? `Числитель больше знаменателя. Смешанное число: ${mixedWhole} целых и ${mixedRemainder}/${denominator}`
                : `Алымы чоң. Аралаш сан катары: ${mixedWhole} бүтүн ${mixedRemainder}/${denominator}`
              )}
            </p>
          </div>
        </div>

        {/* Dynamic SVGs */}
        <div className="flex gap-4 justify-center mt-5">
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-sm">
              <circle cx="50" cy="50" r="42" fill="#FAF7F2" stroke="#E8E2D9" strokeWidth="1" />
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
            <span className="text-[9px] text-natural-gray mt-1 font-bold">1-{lang === "ru" ? "пирог" : "пирог"} 🍕</span>
          </div>

          {isImproper && (
            <div className="flex flex-col items-center animate-fade-in">
              <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-sm">
                <circle cx="50" cy="50" r="42" fill="#FAF7F2" stroke="#E8E2D9" strokeWidth="1" />
                {extraSlices.map((slice, idx) => (
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
              <span className="text-[9px] text-natural-gray mt-1 font-bold">2-{lang === "ru" ? "пирог" : "пирог"} 🍕</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          if (onSuccess) {
            playChime("success");
            onSuccess();
          }
        }}
        className="w-full bg-[#445044] hover:bg-[#343e34] text-white py-3 px-4 rounded-xl text-xs font-bold transition shadow-sm animate-hover"
      >
        {t.fraction_understood}
      </button>
    </div>
  );
}

// 3. DECIMAL PLACE VALUE SLIDER WIDGET
export function DecimalsWidget({ onSuccess, lang = "kg" }: WidgetProps) {
  const [val, setVal] = useState<number>(2.45);

  const t = WIDGET_TRANSLATIONS[lang] || WIDGET_TRANSLATIONS.kg;

  const whole = Math.floor(val);
  const remainder = Math.round((val - whole) * 100);
  const tenths = Math.floor(remainder / 10);
  const hundredths = remainder % 10;

  // Kyrgyz pronunciation helper for decimals
  const numberToKyrgyz = (num: number): string => {
    const words = ["нөл", "бир", "эки", "үч", "төрт", "беш", "алты", "жети", "сегиз", "тогуз"];
    return words[num] || num.toString();
  };

  const remainderToKyrgyz = (rem: number): string => {
    const tensWords = ["", "он", "жыйырма", "отуз", "кырк", "элүү", "алтымыш", "жетимиш", "сексен", "токсон"];
    const unitsWords = ["нөл", "бир", "эки", "үч", "төрт", "беш", "алты", "жети", "сегиз", "тогуз"];

    if (rem === 0) return "";
    if (rem < 10) return unitsWords[rem];
    
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    return `${tensWords[t]} ${u > 0 ? unitsWords[u] : ""}`.trim();
  };

  // Russian pronunciation helper
  const numberToRussian = (num: number): string => {
    const words = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
    return words[num] || num.toString();
  };

  const remainderToRussian = (rem: number): string => {
    const tensWords = ["", "десять", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
    const unitsWords = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];

    if (rem === 0) return "";
    if (rem < 10) return unitsWords[rem];
    
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    return `${tensWords[t]} ${u > 0 ? unitsWords[u] : ""}`.trim();
  };

  let verbalTranslation = "";
  if (lang === "ru") {
    if (remainder === 0) {
      verbalTranslation = `${numberToRussian(whole)} целых`;
    } else if (remainder % 10 === 0) {
      verbalTranslation = `${numberToRussian(whole)} целых и ${numberToRussian(remainder / 10)} десятых`;
    } else {
      verbalTranslation = `${numberToRussian(whole)} целых и ${remainderToRussian(remainder)} сотых`;
    }
  } else {
    if (remainder === 0) {
      verbalTranslation = `${numberToKyrgyz(whole)} бүтүн`;
    } else if (remainder % 10 === 0) {
      verbalTranslation = `${numberToKyrgyz(whole)} бүтүн ондон ${numberToKyrgyz(remainder / 10)}`;
    } else {
      verbalTranslation = `${numberToKyrgyz(whole)} бүтүн жүздөн ${remainderToKyrgyz(remainder)}`;
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-natural-border shadow-sm" id="decimals-widget">
      <h4 className="font-sans font-extrabold text-natural-dark mb-1 text-center text-sm sm:text-base">
        {t.decimals_title}
      </h4>
      <p className="text-xs text-natural-gray mb-4 text-center font-medium">
        {t.decimals_sub}
      </p>

      {/* Value Display */}
      <div className="bg-natural-green/20 rounded-2xl p-4 border border-natural-green-text/15 mb-4 text-center">
        <span className="text-3xl font-mono font-black text-natural-green-text">{val.toFixed(2).replace(".", ",")}</span>
        <div className="h-px bg-natural-green-text/15 my-2"></div>
        <p className="text-xs font-bold text-natural-dark italic">"{verbalTranslation}"</p>
      </div>

      <input
        type="range"
        min="0"
        max="9.99"
        step="0.01"
        value={val}
        onChange={(e) => {
          setVal(parseFloat(e.target.value));
          playChime("click");
        }}
        className="w-full h-2 bg-natural-border rounded-lg appearance-none cursor-pointer accent-[#445044] mb-6"
      />

      {/* Place Value Table */}
      <h5 className="text-[10px] uppercase font-extrabold text-natural-gray mb-2 tracking-wider">{t.decimals_table}</h5>
      <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-xs mb-4">
        <div className="bg-natural-bg p-2.5 rounded-xl border border-natural-border">
          <div className="text-[9px] text-natural-gray font-sans mb-1 font-bold">{t.decimals_ones}</div>
          <span className="text-natural-dark font-black text-sm">{whole}</span>
        </div>
        <div className="bg-natural-bg p-2.5 rounded-xl border border-natural-border flex items-center justify-center relative">
          <div className="text-[9px] text-natural-gray font-sans mb-1 font-bold absolute top-1">{t.decimals_comma}</div>
          <span className="text-natural-orange-text font-black text-xl mt-3">,</span>
        </div>
        <div className="bg-natural-bg p-2.5 rounded-xl border border-natural-border">
          <div className="text-[9px] text-natural-gray font-sans mb-1 font-bold">{t.decimals_tenths}</div>
          <span className="text-natural-yellow-text font-black text-sm">{tenths}</span>
        </div>
        <div className="bg-natural-bg p-2.5 rounded-xl border border-natural-border">
          <div className="text-[9px] text-natural-gray font-sans mb-1 font-bold">{t.decimals_hundreds}</div>
          <span className="text-[#8B5E3C] font-black text-sm">{hundredths}</span>
        </div>
      </div>

      {/* Informative Note */}
      <div className="bg-natural-bg border border-natural-border p-3 rounded-2xl text-[11px] text-natural-dark leading-relaxed mb-4 font-medium">
        💡 <span className="font-extrabold text-natural-orange-text">{t.decimals_life_example_title}</span> {t.decimals_life_example_desc}
      </div>

      <button
        onClick={() => {
          if (onSuccess) {
            playChime("success");
            onSuccess();
          }
        }}
        className="w-full bg-[#445044] hover:bg-[#343e34] text-white py-3 px-4 rounded-xl text-xs font-bold transition shadow-sm animate-hover"
      >
        {t.decimals_understood}
      </button>
    </div>
  );
}

// 4. EQUATION BALANCE SCALE WIDGET
export function EquationsWidget({ onSuccess, lang = "kg" }: WidgetProps) {
  const [xVal, setXVal] = useState<number>(3); // Hidden x
  const [targetConst, setTargetConst] = useState<number>(4); // Const offset added on left: x + 4
  const [rightScaleWeight, setRightScaleWeight] = useState<number>(7); // Total right: 7
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = WIDGET_TRANSLATIONS[lang] || WIDGET_TRANSLATIONS.kg;
  const currentTotalLeft = xVal + targetConst;

  const handleWeightChange = (side: "left" | "right", amount: number) => {
    if (side === "left") {
      const newVal = Math.max(0, targetConst + amount);
      setTargetConst(newVal);
    } else {
      const newVal = Math.max(0, rightScaleWeight + amount);
      setRightScaleWeight(newVal);
    }
    setErrorMessage(null);
    playChime("click");
  };

  const handleXGuess = (guess: number) => {
    if (guess === rightScaleWeight - targetConst) {
      setXVal(guess);
      setErrorMessage(null);
      playChime("success");
      if (onSuccess) onSuccess();
    } else {
      playChime("click");
      if (lang === "ru") {
        setErrorMessage(`Ой, это неверно. Чтобы сбалансировать весы, вычтите из правого веса (${rightScaleWeight}) добавку слева (${targetConst})!`);
      } else {
        setErrorMessage(`Ой, бул туура эмес. Тараза теңдештирилиши үчүн оң тараптагы сандан (${rightScaleWeight}) сол тараптагы кошумча санды (${targetConst}) кемитип көрүңүз!`);
      }
    }
  };

  const tiltAngle = Math.min(15, Math.max(-15, (currentTotalLeft - rightScaleWeight) * 4));

  return (
    <div className="bg-white rounded-3xl p-5 border border-natural-border shadow-sm" id="equations-widget">
      <h4 className="font-sans font-extrabold text-natural-dark mb-1 text-center text-sm sm:text-base flex items-center justify-center gap-1.5">
        <Scale className="text-natural-orange" size={18} />
        {t.equation_title}
      </h4>
      <p className="text-xs text-natural-gray mb-4 text-center font-medium">
        {t.equation_sub}
      </p>

      {/* Balance Scale Art */}
      <div className="bg-natural-bg border border-natural-border rounded-2xl p-6 mb-4 flex flex-col items-center relative overflow-hidden h-44">
        {/* Beam and Pans */}
        <div 
          className="w-full flex justify-between items-center transition-all duration-300 relative z-10"
          style={{ transform: `rotate(${tiltAngle}deg)` }}
        >
          {/* Left Pan */}
          <div className="flex flex-col items-center" style={{ transform: `rotate(${-tiltAngle}deg)` }}>
            <div className="w-20 h-1.5 bg-[#8C8273]/60 rounded-full"></div>
            <div className="w-16 h-8 border-l border-r border-[#8C8273]/30 relative"></div>
            <div className="w-20 h-5 bg-natural-yellow/40 border border-natural-yellow-dark/40 rounded-b-full flex items-center justify-center -mt-1 shadow-inner">
              <div className="flex gap-1 items-center justify-center">
                <div className="w-6 h-6 bg-[#445044] text-white text-[10px] font-black font-mono rounded flex items-center justify-center shadow-md">
                  x
                </div>
                <span className="text-[9px] font-black text-natural-dark">+</span>
                <div className="px-1.5 py-0.5 bg-natural-orange text-natural-orange-text text-[9px] font-black rounded shadow-sm">
                  {targetConst}
                </div>
              </div>
            </div>
            <span className="text-[9px] font-bold text-natural-gray mt-1">{t.left}: x + {targetConst}</span>
          </div>

          {/* Central fulcrum column */}
          <div className="absolute left-1/2 -bottom-24 -translate-x-1/2 w-4 h-36 bg-[#8C8273]/40 z-0 rounded-full flex justify-center">
            <div className="w-1 h-36 bg-[#8C8273]/60"></div>
          </div>

          {/* Right Pan */}
          <div className="flex flex-col items-center" style={{ transform: `rotate(${-tiltAngle}deg)` }}>
            <div className="w-20 h-1.5 bg-[#8C8273]/60 rounded-full"></div>
            <div className="w-16 h-8 border-l border-r border-[#8C8273]/30 relative"></div>
            <div className="w-20 h-5 bg-natural-green/40 border border-natural-green-text/20 rounded-b-full flex items-center justify-center -mt-1 shadow-inner">
              <div className="px-2.5 py-0.5 bg-natural-green-text text-white text-[9px] font-black rounded shadow-md">
                {rightScaleWeight} {lang === "ru" ? "кг" : "кг"}
              </div>
            </div>
            <span className="text-[9px] font-bold text-natural-gray mt-1">{t.right}: {rightScaleWeight}</span>
          </div>
        </div>

        {/* Support block */}
        <div className="absolute bottom-0 w-28 h-6 bg-[#4A443C] rounded-t-xl z-10 flex items-center justify-center">
          <span className="text-[9px] font-black text-natural-bg font-mono">{t.scale_label}</span>
        </div>
      </div>

      {/* Adjust Weights */}
      <div className="bg-natural-bg p-3 rounded-xl border border-natural-border mb-4 text-xs text-natural-dark">
        <p className="font-extrabold text-natural-dark mb-2 text-center">{t.adjust_scale}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-1 bg-white p-2 rounded-lg border border-natural-border">
            <span className="text-[10px] font-bold text-natural-gray text-center">{t.adjust_left}</span>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => handleWeightChange("left", -1)}
                className="p-1 rounded bg-natural-bg border border-natural-border text-natural-dark hover:bg-natural-border animate-hover"
              >
                <Minus size={12} />
              </button>
              <span className="font-mono font-black text-natural-orange-text">{targetConst}</span>
              <button 
                onClick={() => handleWeightChange("left", 1)}
                className="p-1 rounded bg-natural-bg border border-natural-border text-natural-dark hover:bg-natural-border animate-hover"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 bg-white p-2 rounded-lg border border-natural-border">
            <span className="text-[10px] font-bold text-natural-gray text-center">{t.adjust_right}</span>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => handleWeightChange("right", -1)}
                className="p-1 rounded bg-natural-bg border border-natural-border text-natural-dark hover:bg-natural-border animate-hover"
              >
                <Minus size={12} />
              </button>
              <span className="font-mono font-black text-natural-green-text">{rightScaleWeight}</span>
              <button 
                onClick={() => handleWeightChange("right", 1)}
                className="p-1 rounded bg-natural-bg border border-natural-border text-natural-dark hover:bg-natural-border animate-hover"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Inline Error Message */}
      {errorMessage && (
        <div className="bg-natural-orange/15 border border-natural-orange-text/20 rounded-xl p-3 mb-4 text-xs font-semibold text-natural-orange-text text-center animate-fade-in">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Equation solver math */}
      <div className="bg-[#445044]/10 p-4 rounded-2xl border border-natural-green-text/10 text-center">
        <div className="text-sm font-extrabold text-natural-green-text mb-2">
          {t.equation_label} <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-natural-border">x + {targetConst} = {rightScaleWeight}</span>
        </div>
        <p className="text-xs text-natural-dark font-medium mb-3">{t.equation_guess}</p>

        {/* Interactive buttons with numbers */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
            <button
              key={num}
              onClick={() => handleXGuess(num)}
              className="px-3 py-2 bg-white border border-natural-border hover:border-[#445044] text-natural-dark font-mono text-xs font-black rounded-xl hover:bg-natural-green/10 transition shadow-sm animate-hover animate-active"
            >
              x = {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5. GEOMETRY AREA GRID WIDGET
export function GeometryWidget({ onSuccess, lang = "kg" }: WidgetProps) {
  const [width, setWidth] = useState<number>(5);
  const [height, setHeight] = useState<number>(3);

  const t = WIDGET_TRANSLATIONS[lang] || WIDGET_TRANSLATIONS.kg;

  const area = width * height;
  const perimeter = 2 * (width + height);

  const gridCells = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      gridCells.push(`${r}-${c}`);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-natural-border shadow-sm" id="geometry-widget">
      <h4 className="font-sans font-extrabold text-natural-dark mb-1 text-center text-sm sm:text-base">
        {t.geometry_title}
      </h4>
      <p className="text-xs text-natural-gray mb-4 text-center font-medium">
        {t.geometry_sub}
      </p>

      {/* Dimensions Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex flex-col items-center bg-natural-orange/10 p-3 rounded-xl border border-natural-orange/20">
          <span className="text-[10px] font-black text-natural-orange-text uppercase mb-1">{t.length}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (width > 2) {
                  setWidth(width - 1);
                  playChime("click");
                }
              }}
              className="p-1 rounded bg-white border border-natural-orange/20 text-natural-orange-text hover:bg-natural-orange/10 animate-hover"
            >
              <Minus size={12} />
            </button>
            <span className="text-sm font-mono font-black text-natural-orange-text">{width} {lang === "ru" ? "см" : "см"}</span>
            <button
              onClick={() => {
                if (width < 10) {
                  setWidth(width + 1);
                  playChime("click");
                }
              }}
              className="p-1 rounded bg-white border border-natural-orange/20 text-natural-orange-text hover:bg-natural-orange/10 animate-hover"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center bg-natural-green/20 p-3 rounded-xl border border-natural-green-text/10">
          <span className="text-[10px] font-black text-natural-green-text uppercase mb-1">{t.width}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (height > 2) {
                  setHeight(height - 1);
                  playChime("click");
                }
              }}
              className="p-1 rounded bg-white border border-natural-green-text/15 text-natural-green-text hover:bg-natural-green/10 animate-hover"
            >
              <Minus size={12} />
            </button>
            <span className="text-sm font-mono font-black text-natural-green-text">{height} {lang === "ru" ? "см" : "см"}</span>
            <button
              onClick={() => {
                if (height < 7) {
                  setHeight(height + 1);
                  playChime("click");
                }
              }}
              className="p-1 rounded bg-white border border-natural-green-text/15 text-natural-green-text hover:bg-natural-green/10 animate-hover"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Canvas representation */}
      <div className="bg-natural-bg border border-natural-border rounded-2xl p-6 mb-4 flex items-center justify-center overflow-auto min-h-[180px]">
        <div 
          className="grid border-4 border-[#445044] bg-white shadow-sm transition-all duration-300"
          style={{
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            width: `${width * 28}px`,
            height: `${height * 28}px`,
          }}
        >
          {gridCells.map((cell, idx) => (
            <div 
              key={cell} 
              className="border border-[#445044]/20 flex items-center justify-center text-[8px] font-mono font-black text-natural-green-text bg-natural-green/15 animate-fade-in"
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Live Formulas calculations */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
        <div className="bg-natural-orange/15 p-3 rounded-xl border border-natural-orange/30">
          <div className="text-[10px] text-natural-orange-text font-extrabold mb-1">{t.area_label}</div>
          <p className="font-mono text-base font-extrabold text-natural-orange-text">{area} {lang === "ru" ? "см²" : "см²"}</p>
          <span className="text-[9px] text-natural-orange-text/80 font-mono font-bold">{width} × {height} = {area}</span>
        </div>

        <div className="bg-natural-yellow/20 p-3 rounded-xl border border-natural-yellow-dark/30">
          <div className="text-[10px] text-natural-yellow-text font-extrabold mb-1">{t.perimeter_label}</div>
          <p className="font-mono text-base font-extrabold text-natural-yellow-text">{perimeter} {lang === "ru" ? "см" : "см"}</p>
          <span className="text-[9px] text-natural-yellow-text/80 font-mono font-bold">2 × ({width} + {height}) = {perimeter}</span>
        </div>
      </div>

      <button
        onClick={() => {
          if (onSuccess) {
            playChime("success");
            onSuccess();
          }
        }}
        className="w-full bg-[#445044] hover:bg-[#343e34] text-white py-3 px-4 rounded-xl text-xs font-bold transition shadow-sm animate-hover"
      >
        {t.geometry_understood}
      </button>
    </div>
  );
}
