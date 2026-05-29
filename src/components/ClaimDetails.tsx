/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ClaimResult, Verdict } from "../types";
import SourceCard from "./SourceCard";
import { CheckCircle2, XCircle, AlertTriangle, ChevronRight, BookOpen, Link, Network } from "lucide-react";

interface ClaimDetailsProps {
  claim: ClaimResult | null;
}

export default function ClaimDetails({ claim }: ClaimDetailsProps) {
  if (!claim) {
    return (
      <div className="py-20 text-center text-slate-400 px-6 flex flex-col items-center justify-center h-full">
        <BookOpen className="w-10 h-10 text-slate-300 mb-3 stroke-[1.5]" />
        <p className="text-sm font-semibold text-slate-600 mb-1">Select a Paragraph to Audit</p>
        <p className="text-xs text-slate-400 max-w-[280px]">
          Click on any interactive block/paragraph in the left workspace to inspect real-time sources, timeline, and editorial corrections.
        </p>
      </div>
    );
  }

  // Define verdict styles
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let BadgeIcon = AlertTriangle;
  let verdictLabel = "Inconclusive";

  switch (claim.verdict) {
    case Verdict.SUPPORTED:
      badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
      BadgeIcon = CheckCircle2;
      verdictLabel = "Factual Integrity Verified";
      break;
    case Verdict.REFUTED:
      badgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
      BadgeIcon = XCircle;
      verdictLabel = "Factual Contradiction Detected";
      break;
    case Verdict.INCONCLUSIVE:
    default:
      badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
      BadgeIcon = AlertTriangle;
      verdictLabel = "Inconclusive / Unverifiable Claim";
      break;
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Verdict Header */}
      <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${badgeStyle}`}>
        <BadgeIcon className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="text-xs font-mono tracking-wider uppercase opacity-80 leading-none mb-1">
            VERDICT STATUS
          </h4>
          <p className="text-base font-bold font-display leading-tight">{verdictLabel}</p>
        </div>
      </div>

      {/* Extracted Core Claim */}
      <div className="bg-slate-50 border border-slate-250/60 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase block mb-1">
          Extracted Core Claim Summary
        </span>
        <p className="text-sm font-mono text-slate-800 bg-white/75 border border-slate-100 p-2.5 rounded font-medium">
          {claim.claimSummary || "No checkable declarative facts extracted."}
        </p>
      </div>

      {/* Editor Description */}
      <div>
        <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Editor's Case Summary
        </h4>
        <div className="bg-white border border-slate-150 p-4 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-line">
          {claim.explanation}
        </div>
      </div>

      {/* Logical Reasoning Path */}
      {claim.reasoningPath && claim.reasoningPath.length > 0 && (
        <div>
          <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase mb-2.5 flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5" />
            Logical Reasoning Path
          </h4>
          <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-4">
            {claim.reasoningPath.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Node counter circle */}
                <span className="absolute -left-[24.5px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[9px] font-mono font-bold text-slate-600 ring-4 ring-white">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-650 leading-relaxed font-medium">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated Source List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5" />
            Curated Evidence Sources ({claim.evidence?.length || 0})
          </h4>
          {claim.searchEngineUsed && (
            <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 font-mono py-0.5 px-2 rounded-full flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Verified via {claim.searchEngineUsed}
            </span>
          )}
        </div>
        {claim.evidence && claim.evidence.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {claim.evidence.map((src, index) => (
              <SourceCard key={index} source={src} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl py-6 px-4 text-center border border-dashed border-slate-200 text-xs text-slate-400 font-mono">
            No direct web sources or citations parsed because statement has minor factual check-worthiness or is accurate introduction.
          </div>
        )}
      </div>
    </div>
  );
}
