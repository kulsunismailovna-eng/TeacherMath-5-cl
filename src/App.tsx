import React, { useState, useEffect } from "react";
import { BookOpen, Gamepad2, Sparkles, User, Flame, Award, Trash2 } from "lucide-react";
import { UserProfile, Lesson, Achievement } from "./types";
import { LESSONS_KG, LESSONS_RU, ACHIEVEMENTS_KG, ACHIEVEMENTS_RU } from "./data/lessons";
import { TRANSLATIONS } from "./data/translations";
import Dashboard from "./components/Dashboard";
import LessonDetail from "./components/LessonDetail";
import QuizRunner from "./components/QuizRunner";
import MathTutor from "./components/MathTutor";
import MathGames from "./components/MathGames";
import PaymentWall from "./components/PaymentWall";

const INITIAL_PROFILE: UserProfile = {
  name: "",
  xp: 0,
  level: 1,
  streak: 1,
  completedLessons: [],
  unlockedAchievements: [],
  lastActiveDate: new Date().toDateString(),
  solvedCount: 0, // Used for Sprint High Score
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [activeView, setActiveView] = useState<"dashboard" | "tutor" | "games" | "profile">("dashboard");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [showNotification, setShowNotification] = useState<{ show: boolean; title: string; desc: string } | null>(null);
  const [tempLang, setTempLang] = useState<"kg" | "ru">("kg");

  // Load profile from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("math_5_grade_profile");
    if (saved) {
      try {
        const parsed: UserProfile = JSON.parse(saved);
        
        // Handle Streak calculation: If last active was yesterday, streak increments. If today, same. Otherwise reset.
        const today = new Date().toDateString();
        const lastActive = parsed.lastActiveDate;
        let streak = parsed.streak;

        if (lastActive !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastActive === yesterday.toDateString()) {
            streak += 1;
          } else {
            streak = 1; // reset streak
          }
        }

        setProfile({
          ...parsed,
          streak,
          lastActiveDate: today,
        });
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    }
  }, []);

  // Save profile to localStorage on any change
  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem("math_5_grade_profile", JSON.stringify(newProfile));
  };

  // Onboarding action
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingName.trim()) return;
    
    const newProfile: UserProfile = {
      ...INITIAL_PROFILE,
      name: onboardingName.trim(),
      language: tempLang,
      lastActiveDate: new Date().toDateString(),
    };
    saveProfile(newProfile);
  };

  // Achievement Unlocker checking engine
  const checkAndUnlockAchievements = (updatedProfile: UserProfile, actionType?: string, actionVal?: any): UserProfile => {
    const unlockedNow = [...updatedProfile.unlockedAchievements];
    let showPop = false;
    let lastUnlockedTitle = "";
    let lastUnlockedDesc = "";

    const userLang = updatedProfile.language || "kg";
    const achievements = userLang === "ru" ? ACHIEVEMENTS_RU : ACHIEVEMENTS_KG;

    const tryUnlock = (id: string, condition: boolean) => {
      if (condition && !unlockedNow.includes(id)) {
        unlockedNow.push(id);
        const ach = achievements.find((a) => a.id === id);
        if (ach) {
          lastUnlockedTitle = ach.title;
          lastUnlockedDesc = ach.description;
          showPop = true;
          // Award bonus XP for unlock!
          updatedProfile.xp += 100;
        }
      }
    };

    // 1. first-step: Complete any lesson
    tryUnlock("first-step", updatedProfile.completedLessons.length >= 1);

    // 2. quiz-champion: Perfect score
    tryUnlock("quiz-champion", actionType === "quiz-perfect");

    // 3. ai-friend: Chat with tutor
    tryUnlock("ai-friend", actionType === "ai-chat");

    // 4. sprint-master: Score >= 10 in Sprint
    tryUnlock("sprint-master", actionType === "sprint-high" && actionVal >= 10);

    // 5. fraction-expert: Complete fraction lesson
    tryUnlock("fraction-expert", updatedProfile.completedLessons.includes("fractions"));

    // 6. math-star: Reach level 5
    const lvl = getLevelNumber(updatedProfile.xp);
    tryUnlock("math-star", lvl >= 5);

    if (showPop) {
      const isRu = userLang === "ru";
      const medalTitle = isRu ? `Медаль разблокирована: "${lastUnlockedTitle}"! 🏆` : `Медаль ачылды: "${lastUnlockedTitle}"! 🏆`;
      const medalDesc = isRu ? `"${lastUnlockedDesc}" Вам начислено +100 XP бонуса!` : `"${lastUnlockedDesc}" Сизге +100 XP бонус берилди!`;
      
      setShowNotification({
        show: true,
        title: medalTitle,
        desc: medalDesc,
      });
      setTimeout(() => setShowNotification(null), 5000);
    }

    return {
      ...updatedProfile,
      unlockedAchievements: unlockedNow,
      level: lvl,
    };
  };

  const getLevelNumber = (xp: number) => {
    if (xp < 100) return 1;
    if (xp < 250) return 2;
    if (xp < 500) return 3;
    if (xp < 800) return 4;
    return 5;
  };

  // Award XP and evaluate leveling/achievements
  const handleXpGain = (amount: number, reason: string) => {
    let updated = { ...profile };
    const oldLvl = updated.level;
    updated.xp += amount;
    const newLvl = getLevelNumber(updated.xp);
    const userLang = updated.language || "kg";
    const appTranslations = TRANSLATIONS[userLang] || TRANSLATIONS.kg;

    if (newLvl > oldLvl) {
      updated.level = newLvl;
      // Show level up alert
      setShowNotification({
        show: true,
        title: appTranslations.levelUpTitle,
        desc: appTranslations.levelUpDesc.replace("{lvl}", newLvl.toString()),
      });
      setTimeout(() => setShowNotification(null), 5000);
    }

    // Run standard achievement checks
    if (reason.includes("Айпери мугалим")) {
      updated = checkAndUnlockAchievements(updated, "ai-chat");
    }

    saveProfile(updated);
  };

  const handleLessonCompletion = (lessonId: string, correct: number, total: number) => {
    let updated = { ...profile };
    
    // Add completed if not there
    if (!updated.completedLessons.includes(lessonId)) {
      updated.completedLessons.push(lessonId);
    }

    // Perfect quiz grade
    if (correct === total) {
      updated = checkAndUnlockAchievements(updated, "quiz-perfect");
    } else {
      updated = checkAndUnlockAchievements(updated);
    }

    saveProfile(updated);
  };

  const handleUpdateHighScore = (newHighScore: number) => {
    let updated = { ...profile };
    if (newHighScore > (updated.solvedCount || 0)) {
      updated.solvedCount = newHighScore;
    }
    
    updated = checkAndUnlockAchievements(updated, "sprint-high", newHighScore);
    saveProfile(updated);
  };

  const handleResetProgress = () => {
    localStorage.removeItem("math_5_grade_profile");
    setProfile(INITIAL_PROFILE);
    setSelectedLesson(null);
    setIsTesting(false);
    setActiveView("dashboard");
  };

  // Rendering onboarding
  if (!profile.name) {
    const tOnboarding = TRANSLATIONS[tempLang] || TRANSLATIONS.kg;

    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 border-[8px] border-natural-border relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-16 -top-16 w-40 h-40 bg-natural-yellow/40 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-40 h-40 bg-natural-green/40 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 text-center space-y-6">
            {/* Language Selector in Onboarding */}
            <div className="flex justify-end gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setTempLang("kg")}
                className={`px-3 py-1 text-xs rounded-full font-bold border transition ${
                  tempLang === "kg"
                    ? "bg-natural-yellow border-natural-yellow-dark text-natural-yellow-text shadow-sm"
                    : "bg-white border-natural-border text-natural-gray hover:bg-natural-bg"
                }`}
              >
                KG 🇰🇬
              </button>
              <button
                type="button"
                onClick={() => setTempLang("ru")}
                className={`px-3 py-1 text-xs rounded-full font-bold border transition ${
                  tempLang === "ru"
                    ? "bg-natural-yellow border-natural-yellow-dark text-natural-yellow-text shadow-sm"
                    : "bg-white border-natural-border text-natural-gray hover:bg-natural-bg"
                }`}
              >
                RU 🇷🇺
              </button>
            </div>

            <div className="flex justify-center gap-1.5 text-3xl select-none animate-bounce mt-2">
              🔢 🍕 📐 🎒
            </div>
            
            <div>
              <h1 className="text-2xl font-black text-natural-dark tracking-tight">{tOnboarding.appName}</h1>
              <p className="text-xs text-natural-gray mt-1.5 leading-relaxed">
                {tOnboarding.appSubTitle}
              </p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-bold text-natural-gray uppercase tracking-wider block mb-1 px-1">
                  {tOnboarding.enterNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  placeholder={tOnboarding.enterNamePlaceholder}
                  className="w-full bg-natural-bg border border-natural-border focus:border-natural-yellow-text focus:ring-1 focus:ring-natural-yellow-text/20 rounded-2xl px-4 py-3 text-sm focus:outline-none transition text-natural-dark font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-natural-yellow-text hover:bg-natural-yellow-text/95 text-white font-bold py-3 px-4 rounded-2xl text-xs transition shadow-md hover:scale-[1.02]"
              >
                {tOnboarding.startButton}
              </button>
            </form>
          </div>

          <div className="relative z-10 text-[9px] text-natural-gray text-center mt-12 leading-relaxed">
            {tOnboarding.footerCredits}
          </div>
        </div>
      </div>
    );
  }

  const lang = profile.language || "kg";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.kg;
  const lessonsList = lang === "ru" ? LESSONS_RU : LESSONS_KG;
  const isSelectedLessonPaid = selectedLesson ? lessonsList.findIndex(l => l.id === selectedLesson.id) >= 1 : false;
  const isSelectedLessonLocked = selectedLesson && isSelectedLessonPaid && !profile.hasPaid;

  return (
    <div className="min-h-screen bg-natural-bg flex justify-center font-sans antialiased sm:py-6">
      {/* Visual responsive smartphone style container */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[850px] flex flex-col justify-between shadow-2xl sm:rounded-[48px] border-[8px] border-natural-border overflow-hidden relative">
        
        {/* Floating Notification Popups */}
        {showNotification?.show && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-natural-yellow border-2 border-natural-yellow-dark text-natural-yellow-text p-4 rounded-2xl shadow-xl flex items-start gap-3 animate-fade-in">
            <span className="text-2xl mt-0.5 shrink-0">🏆</span>
            <div>
              <h5 className="font-bold text-xs">{showNotification.title}</h5>
              <p className="text-[10px] text-natural-yellow-text/90 mt-1 leading-normal">{showNotification.desc}</p>
            </div>
          </div>
        )}

        {/* TOP STATUS BAR (SIMULATED MOBILE HEADER) */}
        <div className="bg-natural-bg px-5 py-3.5 border-b border-natural-border flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold">🎒</span>
            <span className="font-black text-xs text-natural-dark uppercase tracking-wider">{lang === "ru" ? "МАТЕМАТИКА" : "МА ТЕМАТИКА"}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* XP Bubble */}
            <div className="flex items-center gap-1 bg-natural-yellow/40 border border-natural-yellow-dark/50 px-2.5 py-0.5 rounded-full" title={lang === "ru" ? "Общий счет" : "Жалпы упай"}>
              <span className="text-natural-yellow-text text-xs">⭐</span>
              <span className="font-mono text-[10px] font-black text-[#7A702E]">{profile.xp} XP</span>
            </div>

            {/* Streak Flame */}
            <div className="flex items-center gap-1 bg-natural-orange/30 border border-natural-orange/50 px-2.5 py-0.5 rounded-full" title={lang === "ru" ? "Ударный режим" : "Күнүмдүк катар"}>
              <span className="text-natural-orange-text text-xs">🔥</span>
              <span className="font-mono text-[10px] font-black text-natural-orange-text">{profile.streak}</span>
            </div>
          </div>
        </div>

        {/* MAIN CONTAINER WINDOW (SCROLLABLE AREA) */}
        <div className="flex-1 overflow-y-auto px-4 py-5 max-h-[calc(100vh-125px)] min-h-[350px]">
          {isTesting && selectedLesson ? (
            <QuizRunner
              lesson={selectedLesson}
              onClose={() => setIsTesting(false)}
              onFinish={(score, total) => {
                handleLessonCompletion(selectedLesson.id, score, total);
              }}
              onXpGain={handleXpGain}
              lang={lang}
            />
          ) : selectedLesson ? (
            isSelectedLessonLocked ? (
              <PaymentWall
                userProfile={profile}
                lesson={selectedLesson}
                onBack={() => setSelectedLesson(null)}
                onUnlockSuccess={() => {
                  const updated = { ...profile, hasPaid: true };
                  updated.xp += 50;
                  saveProfile(updated);
                  setShowNotification({
                    show: true,
                    title: lang === "ru" ? "Доступ Активирован! 👑" : "Кирүү активацияланды! 👑",
                    desc: lang === "ru" ? "Все уроки разблокированы! Вам начислено +50 XP." : "Бардык сабактар ачылды! Сизге +50 XP берилди.",
                  });
                  setTimeout(() => setShowNotification(null), 5000);
                }}
              />
            ) : (
              <LessonDetail
                lesson={selectedLesson}
                userProfile={profile}
                onBack={() => setSelectedLesson(null)}
                onStartQuiz={() => setIsTesting(true)}
                onXpGain={handleXpGain}
              />
            )
          ) : (
            <>
              {activeView === "dashboard" && (
                <Dashboard
                  userProfile={profile}
                  onSelectLesson={(lesson) => setSelectedLesson(lesson)}
                  onResetProgress={handleResetProgress}
                />
              )}
              {activeView === "tutor" && (
                <MathTutor
                  userProfile={profile}
                  onXpGain={handleXpGain}
                />
              )}
              {activeView === "games" && (
                <MathGames
                  userProfile={profile}
                  onXpGain={handleXpGain}
                  onUpdateHighScore={handleUpdateHighScore}
                />
              )}
              {activeView === "profile" && (
                <div className="space-y-6 animate-fade-in" id="profile-view">
                  <div className="bg-natural-bg border border-natural-border p-5 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-natural-green text-natural-green-text rounded-full flex items-center justify-center text-2xl mx-auto shadow-sm font-bold">
                      🧑‍🎓
                    </div>
                    <h3 className="font-sans font-black text-natural-dark text-sm mt-3">{profile.name}</h3>
                    <p className="text-[10px] text-natural-gray mt-1 uppercase tracking-wider font-semibold">
                      {t.nextLevel}: {profile.level} • {profile.xp} XP
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-sans font-bold text-natural-gray text-[10px] uppercase tracking-wider px-1">{t.settingsTitle}</h4>
                    
                    <div className="bg-white border border-natural-border rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-natural-border flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-natural-gray uppercase">{t.changeNameLabel}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => saveProfile({ ...profile, name: e.target.value })}
                            className="flex-1 bg-natural-bg border border-natural-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-natural-yellow-text/20 text-natural-dark font-medium"
                          />
                        </div>
                      </div>

                      {/* Language Selection Toggle */}
                      <div className="p-4 border-b border-natural-border flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-natural-gray uppercase">{t.langToggle}</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveProfile({ ...profile, language: "kg" })}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              (profile.language || "kg") === "kg"
                                ? "bg-natural-yellow border-natural-yellow-dark text-natural-yellow-text shadow-sm"
                                : "bg-natural-bg border-natural-border text-natural-gray hover:bg-natural-bg/80"
                            }`}
                          >
                            <span>Кыргызча</span> 🇰🇬
                          </button>
                          <button
                            onClick={() => saveProfile({ ...profile, language: "ru" })}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              profile.language === "ru"
                                ? "bg-natural-yellow border-natural-yellow-dark text-natural-yellow-text shadow-sm"
                                : "bg-natural-bg border-natural-border text-natural-gray hover:bg-natural-bg/80"
                            }`}
                          >
                            <span>Русский</span> 🇷🇺
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleResetProgress}
                        className="w-full text-left p-4 hover:bg-rose-50/50 text-rose-500 flex items-center gap-2.5 transition text-xs font-semibold"
                      >
                        <Trash2 size={14} />
                        <span>{t.resetAllProgressBtn}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* BOTTOM NAVIGATION TRAIL */}
        {!isTesting && (
          <div className="bg-white border-t border-natural-border py-4 px-3 flex justify-around items-center z-10 shrink-0 rounded-t-[32px] shadow-[0_-4px_10px_rgba(0,0,0,0.015)]">
            <button
              onClick={() => {
                setActiveView("dashboard");
                setSelectedLesson(null);
              }}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
                activeView === "dashboard" && !selectedLesson
                  ? "text-natural-yellow-text bg-natural-yellow/50 font-bold"
                  : "text-natural-gray hover:text-natural-dark"
              }`}
            >
              <BookOpen size={16} />
              <span className="text-[9px] font-bold">{t.navBook}</span>
            </button>

            <button
              onClick={() => {
                setActiveView("tutor");
                setSelectedLesson(null);
              }}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
                activeView === "tutor"
                  ? "text-natural-yellow-text bg-natural-yellow/50 font-bold"
                  : "text-natural-gray hover:text-natural-dark"
              }`}
            >
              <Sparkles size={16} />
              <span className="text-[9px] font-bold">{t.navTutor}</span>
            </button>

            <button
              onClick={() => {
                setActiveView("games");
                setSelectedLesson(null);
              }}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
                activeView === "games"
                  ? "text-natural-yellow-text bg-natural-yellow/50 font-bold"
                  : "text-natural-gray hover:text-natural-dark"
              }`}
            >
              <Gamepad2 size={16} />
              <span className="text-[9px] font-bold">{t.navGames}</span>
            </button>

            <button
              onClick={() => {
                setActiveView("profile");
                setSelectedLesson(null);
              }}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
                activeView === "profile"
                  ? "text-natural-yellow-text bg-natural-yellow/50 font-bold"
                  : "text-natural-gray hover:text-natural-dark"
              }`}
            >
              <User size={16} />
              <span className="text-[9px] font-bold">{t.navProfile}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
