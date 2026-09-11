'use client';

import { Sparkles, ArrowRight, Code2, Rocket, Briefcase, Mail } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestedQuestion: (question: string) => void;
}

const PROMPT_CARDS = [
  {
    icon: Rocket,
    iconColor: 'text-indigo-600 bg-indigo-50/80 border-indigo-100/80',
    title: 'Top Live Web Apps',
    desc: 'TruckFlow, Meat Zoo, Start2Write, DIGIMAG...',
    prompt: "Show me Zohaib's top live projects and links",
  },
  {
    icon: Code2,
    iconColor: 'text-blue-600 bg-blue-50/80 border-blue-100/80',
    title: 'Engineering & Stack',
    desc: 'MERN stack, Vue.js, WebSockets, Next.js...',
    prompt: 'What are his core technical skills and stack?',
  },
  {
    icon: Briefcase,
    iconColor: 'text-violet-600 bg-violet-50/80 border-violet-100/80',
    title: 'Commercial Experience',
    desc: 'Sideline Technologies, Ropstam Solutions...',
    prompt: 'Tell me about his work experience and companies',
  },
  {
    icon: Mail,
    iconColor: 'text-amber-600 bg-amber-50/80 border-amber-100/80',
    title: 'Contact & Collaboration',
    desc: 'Email, WhatsApp, freelance & full-time...',
    prompt: 'How can I contact Zohaib or hire him?',
  },
];

export function WelcomeScreen({ onSuggestedQuestion }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[62vh] max-w-2xl mx-auto px-4 text-center animate-fade-in">
      {/* ── Glowing Luxury Monogram Avatar ──────────────────── */}
      <div className="relative mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-indigo-900 flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-indigo-500/20 ring-1 ring-white/20 animate-pulse-luxury">
          MZ
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      </div>

      {/* ── Status Pill ──────────────────────────────────────── */}
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-[11px] font-semibold text-slate-700 mb-3">
        <Sparkles className="w-3 h-3 text-indigo-600" />
        <span>Interactive AI Digital Twin</span>
      </div>

      {/* ── Headline ─────────────────────────────────────────── */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-2">
        What would you like to explore?
      </h2>

      {/* ── Subtitle ─────────────────────────────────────────── */}
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed font-normal">
        I represent Muhammad Zohaib. Ask anything about my 8+ live web applications, full-stack architecture, or commercial background.
      </p>

      {/* ── Compact Suggestion Cards (No Tags) ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {PROMPT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => onSuggestedQuestion(card.prompt)}
              className="card-luxury p-3 sm:p-3.5 rounded-xl flex items-center gap-3 group cursor-pointer text-left hover:border-indigo-300 transition-all active:scale-[0.99]"
            >
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {card.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {card.desc}
                </p>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
