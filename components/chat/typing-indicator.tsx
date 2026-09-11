'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Brain, Cpu, Search } from 'lucide-react';

const THINKING_PHASES = [
  {
    text: 'Accessing digital memory & knowledge base...',
    icon: Search,
    color: 'text-indigo-600',
  },
  {
    text: 'Retrieving verified projects & experience...',
    icon: Brain,
    color: 'text-violet-600',
  },
  {
    text: 'Synthesizing response with Gemini AI...',
    icon: Cpu,
    color: 'text-sky-600',
  },
];

export function TypingIndicator() {
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Cycle thinking phrases every 1.8s
  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % THINKING_PHASES.length);
    }, 1800);

    return () => {
      clearInterval(phaseTimer);
    };
  }, []);

  const currentPhase = THINKING_PHASES[phaseIndex];
  const CurrentIcon = currentPhase.icon;

  return (
    <div
      role="status"
      aria-label="AI is thinking"
      className="flex gap-3 sm:gap-3.5 justify-start animate-fade-in w-full max-w-lg select-none"
    >
      {/* Avatar with live breathing beacon */}
      <div className="relative flex-shrink-0 w-8.5 h-8.5 mt-1">
        <img
          src="/zohaib.jpg"
          alt="Muhammad Zohaib"
          className="w-8.5 h-8.5 rounded-xl object-cover shadow-md ring-1 ring-slate-900/10 border border-white"
        />
        {/* Animated radar pulse around avatar */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 ring-2 ring-white" />
        </span>
      </div>

      {/* Main Luxury Thinking Bubble */}
      <div className="relative flex-1 overflow-hidden rounded-2xl sm:rounded-3xl rounded-tl-xs bg-white/95 border border-indigo-100/90 p-3.5 sm:p-4.5 shadow-xl shadow-indigo-500/5 backdrop-blur-md transition-all">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-400 opacity-80" />

        {/* Shimmer Light Sweep across card */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent -skew-x-12 animate-thinking-shimmer" />
        </div>

        {/* Header: Name + Live Elapsed Badge */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4.5 h-4.5 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Sparkles className="w-3 h-3 animate-spin-slow" />
            </div>
            <span className="text-xs font-bold tracking-tight text-slate-800 font-heading truncate">
              Muhammad Zohaib
            </span>
            <span className="text-[9.5px] font-semibold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded-full border border-indigo-100/60 flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Thinking
            </span>
          </div>
        </div>

        {/* Dynamic Thinking Wave & Live Status */}
        <div className="flex items-center gap-3 py-1">
          {/* Animated 4-Bar Neural Spectrum */}
          <div className="flex items-center gap-1 h-5 px-1">
            <span className="w-1 rounded-full bg-indigo-600 animate-wave-bar-1 shadow-xs shadow-indigo-500/50" />
            <span className="w-1 rounded-full bg-violet-500 animate-wave-bar-2 shadow-xs shadow-violet-500/50" />
            <span className="w-1 rounded-full bg-fuchsia-500 animate-wave-bar-3 shadow-xs shadow-fuchsia-500/50" />
            <span className="w-1 rounded-full bg-sky-500 animate-wave-bar-4 shadow-xs shadow-sky-500/50" />
          </div>

          {/* Animated Transitioning Phrase */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CurrentIcon className={`w-3.5 h-3.5 flex-shrink-0 ${currentPhase.color} animate-pulse`} />
            <p
              key={phaseIndex}
              className="text-xs font-medium text-slate-600 truncate animate-fade-in tracking-tight"
            >
              {currentPhase.text}
            </p>
          </div>
        </div>

        {/* Subtle Bottom Ambient Track */}
      
      </div>
    </div>
  );
}
