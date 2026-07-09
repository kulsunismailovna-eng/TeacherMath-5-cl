import React, { useState } from "react";
import { ArrowLeft, Check, Lock, Sparkles, Smartphone, Award, ShieldCheck } from "lucide-react";
import { UserProfile, Lesson } from "../types";
import { TRANSLATIONS } from "../data/translations";

interface PaymentWallProps {
  userProfile: UserProfile;
  lesson: Lesson;
  onBack: () => void;
  onUnlockSuccess: () => void;
}

export default function PaymentWall({ userProfile, lesson, onBack, onUnlockSuccess }: PaymentWallProps) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const lang = userProfile.language || "kg";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.kg;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!confirmText.trim()) {
      setError(
        lang === "ru"
          ? "Пожалуйста, введите код перевода или ваше имя для подтверждения."
          : "Төлөмдү текшерүү үчүн кодду же атыңызды жазыңыз."
      );
      return;
    }

    setIsProcessing(true);

    // Simulate payment validation with a brief, polished loading delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Complete activation
      setTimeout(() => {
        onUnlockSuccess();
      }, 3500);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in" id="payment-wall-view">
      {/* Back Button and Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-natural-gray hover:text-natural-dark p-1.5 rounded-full hover:bg-natural-bg/80 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[9px] uppercase font-bold text-rose-500 tracking-wider">
            {lang === "ru" ? "Доступ ограничен" : "Чектөө киргизилди"}
          </span>
          <h2 className="font-sans font-black text-natural-dark text-base">
            {lesson.title}
          </h2>
        </div>
      </div>

      {isSuccess ? (
        /* SUCCESS ANIMATION AND CELEBRATION SCREEN */
        <div className="bg-white border-4 border-natural-green rounded-[32px] p-8 text-center space-y-5 shadow-xl animate-scale-up">
          <div className="w-20 h-20 bg-natural-green text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg border-4 border-white animate-bounce">
            🎉
          </div>
          <div className="space-y-2">
            <h3 className="font-sans font-black text-natural-green-text text-lg">
              {lang === "ru" ? "Доступ Открыт!" : "Кирүү ачылды!"}
            </h3>
            <p className="text-xs text-natural-dark font-medium leading-relaxed">
              {t.payUnlockSuccess}
            </p>
          </div>
          <div className="p-3.5 bg-natural-green/10 border border-natural-green/20 rounded-2xl flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-natural-green-text animate-pulse" />
            <span className="text-[10px] font-bold text-natural-green-text uppercase tracking-wider">
              {lang === "ru" ? "+50 XP Бонус начислен!" : "+50 XP Бонус берилди!"}
            </span>
          </div>
        </div>
      ) : (
        /* THE MAIN PAYMENT GATEWAY FORM */
        <div className="space-y-5">
          {/* Why it is paid box */}
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-[28px] p-4.5 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-700">
              <Lock size={15} />
              <span className="text-xs font-black uppercase tracking-wider">{t.payTitle}</span>
            </div>
            <p className="text-[11px] text-amber-900/90 leading-relaxed">
              {t.payDesc}
            </p>
          </div>

          {/* Pricing Info bar */}
          <div className="bg-natural-bg/50 border border-natural-border p-4 rounded-2xl flex justify-between items-center">
            <span className="text-xs font-bold text-natural-dark">{t.payPriceLabel}</span>
            <span className="text-sm font-black text-[#7A702E] bg-natural-yellow/40 border border-natural-yellow-dark/30 px-3 py-1 rounded-full">
              {t.payPriceValue}
            </span>
          </div>

          {/* MBANK QR-CODE MERCHANT CARD (Authentic Reconstruction) */}
          <div className="rounded-[36px] bg-gradient-to-b from-[#009245] to-[#005128] p-5 shadow-xl text-white space-y-4">
            {/* MBank Logo Header */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              {/* Custom SVG-like representation of MBank emblem */}
              <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-yellow-500 rounded flex items-center justify-center">
                <span className="text-[10px] font-black text-emerald-950 font-sans leading-none">M1</span>
              </div>
              <span className="font-sans font-black text-xl tracking-tight leading-none text-white">Mbank</span>
            </div>

            {/* Simulated White ELQR Voucher Card */}
            <div className="bg-white rounded-3xl p-5 text-natural-dark text-center space-y-4 shadow-inner relative overflow-hidden">
              <div className="space-y-1">
                <h4 className="font-sans font-black text-sm tracking-tight text-slate-950">
                  КУЛСУНАЙ К.
                </h4>
                <p className="text-[11px] font-bold text-slate-500 tracking-wider">
                  +996 (709) 515 088
                </p>
              </div>

              {/* QR Code Container with Central Overlay Icon */}
              <div className="relative w-48 h-48 mx-auto bg-slate-50 border border-slate-100 rounded-2xl p-2 flex items-center justify-center">
                {/* Dynamic high quality black QR code pointing to payment details */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://mbank.kg/qr/Kulsunay&color=0-0-0"
                  alt="MBank ELQR"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {/* Central overlapping MBank badge */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#009245] p-1.5 rounded-xl border-2 border-white w-9 h-9 flex items-center justify-center shadow-md">
                  <div className="flex items-center justify-center text-white font-sans font-black text-[9px] leading-none">
                    M1
                  </div>
                </div>
              </div>

              {/* ELQR footer brand */}
              <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-slate-100/80">
                {/* ELQR icon container */}
                <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                  QR
                </div>
                <span className="font-sans font-extrabold text-xs tracking-wider text-slate-800">ELQR</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions Details */}
          <div className="text-[11px] text-natural-gray leading-relaxed space-y-1.5 px-1">
            <p className="flex items-start gap-1.5">
              <Smartphone size={13} className="text-natural-green-text shrink-0 mt-0.5" />
              <span>{t.payMbankSub}</span>
            </p>
            <p className="font-bold text-natural-dark text-center py-0.5">
              {t.payRecipientName} • {t.payRecipientPhone}
            </p>
          </div>

          {/* Activation verification form */}
          <form onSubmit={handleActivate} className="bg-natural-bg/40 border border-natural-border p-4.5 rounded-2xl space-y-3.5">
            <div>
              <label className="text-[10px] font-extrabold text-natural-gray uppercase tracking-wider block mb-1.5">
                {t.payConfirmLabel}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError("");
                }}
                placeholder={t.payConfirmPlaceholder}
                className="w-full bg-white border border-natural-border focus:border-natural-yellow-dark focus:ring-1 focus:ring-natural-yellow-dark/20 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition text-natural-dark font-semibold"
                disabled={isProcessing}
              />
              {error && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1">
                  ⚠️ {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-natural-green-text hover:bg-natural-green-text/95 disabled:bg-natural-gray/40 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{lang === "ru" ? "Активация доступа..." : "Активация жүрүүдө..."}</span>
                </>
              ) : (
                <>
                  <Lock size={13} />
                  <span>{t.payUnlockBtn}</span>
                </>
              )}
            </button>
          </form>

          {/* Guarantee of Safety Badge */}
          <div className="flex items-center justify-center gap-1.5 text-natural-gray text-[9px] font-bold uppercase tracking-wider pt-1">
            <ShieldCheck size={12} className="text-natural-green-text" />
            <span>{lang === "ru" ? "Безопасная оплата • ELQR" : "Коопсуз төлөм • ELQR"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
