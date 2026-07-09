import { BookOpen, Trophy, Zap, Sparkles, Pizza, Star, Flame, CheckCircle2, ChevronRight, Award, Lock } from "lucide-react";
import { UserProfile, Lesson, Achievement } from "../types";
import { LESSONS_KG, LESSONS_RU, ACHIEVEMENTS_KG, ACHIEVEMENTS_RU } from "../data/lessons";
import { TRANSLATIONS } from "../data/translations";

interface DashboardProps {
  userProfile: UserProfile;
  onSelectLesson: (lesson: Lesson) => void;
  onResetProgress?: () => void;
}

// Map icon names to Lucide icons
const getIconComponent = (name: string, size = 18) => {
  switch (name) {
    case "BookOpen": return <BookOpen size={size} />;
    case "Trophy": return <Trophy size={size} />;
    case "Zap": return <Zap size={size} />;
    case "Sparkles": return <Sparkles size={size} />;
    case "Pizza": return <Pizza size={size} />;
    case "Star": return <Star size={size} />;
    default: return <Award size={size} />;
  }
};

const getLessonIconEmoji = (id: string) => {
  switch (id) {
    case "natural-numbers": return "🔢";
    case "fractions": return "🍕";
    case "decimals": return "📏";
    case "equations": return "⚖️";
    case "geometry": return "📐";
    default: return "📚";
  }
};

export default function Dashboard({ userProfile, onSelectLesson, onResetProgress }: DashboardProps) {
  const lang = userProfile.language || "kg";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.kg;

  const lessons = lang === "ru" ? LESSONS_RU : LESSONS_KG;
  const achievements = lang === "ru" ? ACHIEVEMENTS_RU : ACHIEVEMENTS_KG;

  // Level thresholds: Lvl 1: 0-100 XP, Lvl 2: 101-250 XP, Lvl 3: 251-500 XP, Lvl 4: 501-800 XP, Lvl 5: 801-1200 XP, etc.
  const getLevelInfo = (xp: number) => {
    if (xp < 100) return { currentLvl: 1, minXp: 0, maxXp: 100, name: t.levelName1 };
    if (xp < 250) return { currentLvl: 2, minXp: 100, maxXp: 250, name: t.levelName2 };
    if (xp < 500) return { currentLvl: 3, minXp: 250, maxXp: 500, name: t.levelName3 };
    if (xp < 800) return { currentLvl: 4, minXp: 500, maxXp: 800, name: t.levelName4 };
    return { currentLvl: 5, minXp: 800, maxXp: 1500, name: t.levelName5 };
  };

  const lvlInfo = getLevelInfo(userProfile.xp);
  const xpNeededForNext = lvlInfo.maxXp - lvlInfo.minXp;
  const xpAcquiredInCurrent = userProfile.xp - lvlInfo.minXp;
  const progressPercent = Math.min(100, Math.round((xpAcquiredInCurrent / xpNeededForNext) * 100));

  return (
    <div className="space-y-6 pb-6" id="dashboard">
      {/* 1. Student Welcoming Card */}
      <div className="bg-[#445044] rounded-[32px] p-5 text-natural-bg shadow-sm relative overflow-hidden border border-[#526052]">
        {/* Dynamic Abstract circles */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-natural-yellow/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-natural-green/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-start">
          <div>
            <span className="text-[9px] bg-natural-bg/15 border border-natural-bg/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-natural-yellow">
              {lvlInfo.name}
            </span>
            <h1 className="text-xl font-sans font-black tracking-tight mt-2 flex items-center gap-1.5">
              {t.welcomeTitle.replace("{name}", userProfile.name)}
            </h1>
            <p className="text-[11px] text-natural-bg/85 mt-1 leading-relaxed">
              {t.welcomeDesc}
            </p>
          </div>

          <div className="bg-natural-bg/10 border border-natural-bg/15 p-2 rounded-2xl text-center shrink-0 flex flex-col items-center min-w-[55px]">
            <Flame className="text-natural-orange animate-pulse" size={20} fill="#E9B384" />
            <span className="text-xs font-mono font-black mt-1 leading-none text-natural-yellow">{userProfile.streak}</span>
            <span className="text-[7px] font-bold text-natural-bg/75 mt-0.5">{t.streakLabel}</span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6 relative z-10">
          <div className="flex justify-between items-end text-[10px] mb-1.5">
            <span className="font-sans font-bold text-natural-bg/90 flex items-center gap-1">
              <Star size={11} fill="#F3E99F" className="text-natural-yellow" />
              {userProfile.xp} {t.xpPoints}
            </span>
            <span className="font-mono font-semibold text-natural-bg/75">
              {lvlInfo.currentLvl}-{t.nextLevel} • {lang === "ru" ? `Осталось ${lvlInfo.maxXp - userProfile.xp} XP` : `Кийинкиге ${lvlInfo.maxXp - userProfile.xp} XP калды`}
            </span>
          </div>

          <div className="w-full bg-natural-bg/15 h-2.5 rounded-full overflow-hidden border border-natural-bg/5">
            <div
              className="bg-natural-yellow h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Bento Statistics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-natural-border shadow-sm text-center">
          <span className="text-[9px] uppercase font-extrabold tracking-wider text-natural-gray">{t.completedLessonsTitle}</span>
          <div className="text-xl font-mono font-black text-natural-green-text mt-1">
            {userProfile.completedLessons.length} / {lessons.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-natural-border shadow-sm text-center">
          <span className="text-[9px] uppercase font-extrabold tracking-wider text-natural-gray">{t.sprintHighScoreTitle}</span>
          <div className="text-xl font-mono font-black text-natural-orange-text mt-1 flex items-center justify-center gap-1">
            <Zap size={14} fill="#E9B384" className="text-natural-orange" />
            <span>{userProfile.solvedCount}</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Lesson Roadmap */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-sans font-black text-natural-dark text-sm flex items-center gap-1.5">
            {t.lessonsRoadmapTitle}
          </h3>
          <span className="text-[10px] text-natural-gray font-bold uppercase">{lessons.length} {lang === "ru" ? "тем" : "тема"}</span>
        </div>

        <div className="space-y-2.5">
          {lessons.map((lesson, idx) => {
            const isCompleted = userProfile.completedLessons.includes(lesson.id);
            const isPaid = idx >= 1; // 2-деңгээлден баштап акылуу
            const isLocked = isPaid && !userProfile.hasPaid;

            return (
              <div
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                className="bg-white border border-natural-border rounded-2xl p-3.5 shadow-sm hover:border-natural-yellow-dark cursor-pointer transition flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3">
                  {/* Icon or emoji */}
                  <div className="w-11 h-11 rounded-xl bg-natural-bg border border-natural-border/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition shrink-0 relative">
                    {getLessonIconEmoji(lesson.id)}
                    {isLocked && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white">
                        <Lock size={8} />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-sans font-extrabold text-xs sm:text-sm text-natural-dark group-hover:text-natural-green-text transition">
                        {lesson.title}
                      </h4>
                      {/* Free or Paid Badge */}
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
                        isPaid
                          ? isLocked
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-green-50 text-green-700 border-green-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {isPaid
                          ? isLocked
                            ? t.payLockedBadge
                            : lang === "ru" ? "Доступно ✅" : "Ачык ✅"
                          : t.payFreeBadge}
                      </span>
                    </div>
                    <p className="text-[10px] text-natural-gray mt-0.5 max-w-[210px] line-clamp-1">
                      {lesson.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isCompleted ? (
                    <span className="text-[#445044] bg-natural-green p-1.5 rounded-full block border border-natural-green-text/20">
                      <CheckCircle2 size={14} fill="#445044" className="text-white" />
                    </span>
                  ) : isLocked ? (
                    <span className="text-amber-600 transition block bg-amber-50 p-1.5 rounded-full border border-amber-100">
                      <Lock size={14} />
                    </span>
                  ) : (
                    <span className="text-natural-gray group-hover:text-natural-dark transition block">
                      <ChevronRight size={18} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Achievements Grid */}
      <div className="space-y-3">
        <h3 className="font-sans font-black text-natural-dark text-sm flex items-center gap-1.5 px-1">
          {t.achievementsTitle}
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {achievements.map((ach) => {
            const isUnlocked = userProfile.unlockedAchievements.includes(ach.id);

            return (
              <div
                key={ach.id}
                className={`border rounded-2xl p-3 flex flex-col items-center text-center transition-all shadow-sm ${
                  isUnlocked
                    ? "bg-white border-natural-yellow-dark ring-2 ring-natural-yellow/10"
                    : "bg-natural-bg/40 border-natural-border opacity-65"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 shadow-sm ${
                    isUnlocked 
                      ? "bg-natural-yellow text-natural-yellow-text border border-natural-yellow-dark/30" 
                      : "bg-natural-bg text-natural-gray border border-natural-border"
                  }`}
                >
                  {getIconComponent(ach.icon, 18)}
                </div>

                <h4 className="font-sans font-extrabold text-[11px] text-natural-dark">
                  {ach.title}
                </h4>
                <p className="text-[8px] text-natural-gray mt-1 leading-normal">
                  {ach.description}
                </p>
                <span className="text-[8px] font-bold mt-2 text-natural-gray bg-natural-bg px-1.5 py-0.5 rounded border border-natural-border/30">
                  {ach.requirement}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {onResetProgress && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => {
              if (confirm(t.resetConfirmMsg)) {
                onResetProgress();
              }
            }}
            className="text-[10px] font-bold text-rose-500/70 hover:text-rose-500 transition cursor-pointer"
          >
            {t.resetProgressBtn}
          </button>
        </div>
      )}
    </div>
  );
}
