'use client';

import { CheckCircle } from 'lucide-react';
import type { SourceCitation } from '@/lib/types';

interface SourceListProps {
  sources: SourceCitation[];
}

const CATEGORY_NAMES: Record<string, string> = {
  skills: 'Skills & Stack',
  projects: 'Projects & Portfolio',
  experience: 'Work Experience',
  services: 'Services Offered',
  education: 'Education',
  certifications: 'Qualifications',
  achievements: 'Achievements',
  contact: 'Contact Info',
  personal: 'Personal Profile',
  faq: 'Frequently Asked Questions',
};

export function SourceList({ sources }: SourceListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        <span>Verified from:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source) => (
          <span
            key={source.source}
            className="px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-600 border border-slate-200/60 text-[11px] font-medium"
          >
            {CATEGORY_NAMES[source.category] ?? source.category}
          </span>
        ))}
      </div>
    </div>
  );
}
