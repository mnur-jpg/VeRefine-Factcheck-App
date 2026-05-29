/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { EvidenceSource, CredibilityClass, EvidenceRelationship } from "../types";
import { ExternalLink, ShieldCheck, Newspaper, Award, HelpCircle, FileText } from "lucide-react";

interface SourceCardProps {
  source: EvidenceSource;
  key?: any;
}

export default function SourceCard({ source }: SourceCardProps) {
  // Select credibility color coding and icons
  let classBadgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  let ClassIcon = FileText;

  switch (source.credibilityClass) {
    case CredibilityClass.PRIMARY:
      classBadgeColor = "bg-sky-50 text-sky-700 border-sky-200/60";
      ClassIcon = ShieldCheck;
      break;
    case CredibilityClass.AUTHORITATIVE:
      classBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200/60";
      ClassIcon = Newspaper;
      break;
    case CredibilityClass.EXPERT:
      classBadgeColor = "bg-teal-50 text-teal-700 border-teal-200/60";
      ClassIcon = Award;
      break;
    case CredibilityClass.FACT_CHECK:
      classBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      ClassIcon = ShieldCheck;
      break;
    case CredibilityClass.SECONDARY:
    default:
      classBadgeColor = "bg-slate-50 text-slate-600 border-slate-200/60";
      ClassIcon = HelpCircle;
      break;
  }

  let hostname = "External Link";
  try {
    if (source.url) {
      hostname = new URL(source.url).hostname;
    }
  } catch (err) {
    console.error("Failed to parse source URL:", source.url);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-350 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${classBadgeColor}`}>
          <ClassIcon className="w-3.5 h-3.5" />
          {source.credibilityClass}
        </span>
        
        {source.relationship && (
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${
            source.relationship === EvidenceRelationship.SUPPORTING
               ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
               : source.relationship === EvidenceRelationship.REFUTING
               ? "bg-rose-50 text-rose-700 border border-rose-100"
               : "bg-slate-100 text-slate-500"
          }`}>
            {source.relationship === EvidenceRelationship.SUPPORTING ? "Cites Support" : "Cites Refutation"}
          </span>
        )}
      </div>

      <h5 className="font-semibold text-slate-900 text-sm mb-1 leading-snug line-clamp-2">
        {source.title}
      </h5>

      {source.snippet && (
        <p className="text-xs text-slate-600 line-clamp-3 italic mb-3">
          "{source.snippet}"
        </p>
      )}

      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2 pt-2 border-t border-slate-100">
        <span className="truncate max-w-[200px]">
          {hostname}
        </span>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
        >
          <span>Visit Source</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
