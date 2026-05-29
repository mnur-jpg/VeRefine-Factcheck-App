/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ClaimResult, Verdict, EditorialCategory } from "../types";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface InLineArticleProps {
  sentences: ClaimResult[];
  selectedSentenceId: string | null;
  onSelectSentence: (id: string) => void;
  metadata?: { title?: string; author?: string; date?: string };
}

export default function InLineArticle({
  sentences,
  selectedSentenceId,
  onSelectSentence,
  metadata,
}: InLineArticleProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full bg-slate-50/30">
      {/* Editor Frame Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono text-slate-400 ml-2">ORIGINAL_DOCUMENT_WORKSPACE</span>
        </div>
        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
          Interactive Draft
        </span>
      </div>

      {/* Main Document Body */}
      <div className="p-8 overflow-y-auto flex-1 max-w-3xl mx-auto w-full">
        {metadata?.title && (
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 mb-2">
            {metadata.title}
          </h1>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6 text-slate-500 text-xs font-mono border-b border-dashed border-slate-200 pb-4">
          {metadata?.author && (
            <span>
              Author: <strong className="text-slate-800">{metadata.author}</strong>
            </span>
          )}
          {metadata?.date && (
            <span>
              Published: <strong className="text-slate-800">{metadata.date}</strong>
            </span>
          )}
          <span>
            Paragraphs: <strong className="text-slate-850">{sentences.length}</strong>
          </span>
        </div>

        {/* Paragraphs and Highlight Blocks */}
        <div className="space-y-4">
          {sentences.map((item) => {
            const isSelected = selectedSentenceId === item.id;
            
            if (!item.isCheckWorthy) {
              // Style regular paragraph with hover and active select highlight
              return (
                <p
                  key={item.id}
                  onClick={() => onSelectSentence(item.id)}
                  className={`cursor-pointer transition-all duration-200 rounded-xl p-4 text-slate-750 hover:bg-slate-100/70 border border-transparent leading-relaxed text-sm ${
                    isSelected ? "bg-slate-100/90 ring-2 ring-slate-400/20 border-slate-300" : ""
                  }`}
                >
                  {item.originalSentence}
                </p>
              );
            }

            // Fact checked item highlighting
            let highlightStyle = "";
            let VerdictIcon = HelpCircle;
            let statusLabel = "";

            switch (item.verdict) {
              case Verdict.SUPPORTED:
                highlightStyle = isSelected
                  ? "bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950"
                  : "bg-emerald-50/40 border-emerald-250/50 hover:bg-emerald-50/70 text-emerald-900";
                VerdictIcon = CheckCircle2;
                statusLabel = "Verified";
                break;
              case Verdict.REFUTED:
                highlightStyle = isSelected
                  ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 text-rose-950"
                  : "bg-rose-50/40 border-rose-250/50 hover:bg-rose-50/70 text-rose-900";
                VerdictIcon = XCircle;
                statusLabel = "Refuted";
                break;
              case Verdict.INCONCLUSIVE:
              default:
                highlightStyle = isSelected
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 text-amber-950"
                  : "bg-amber-50/40 border-amber-250/50 hover:bg-amber-50/70 text-amber-900";
                VerdictIcon = AlertTriangle;
                statusLabel = "Unresolved";
                break;
            }

            return (
              <div
                key={item.id}
                onClick={() => onSelectSentence(item.id)}
                className={`cursor-pointer transition-all duration-200 rounded-xl p-4 border flex flex-col space-y-2 relative group leading-relaxed text-sm ${highlightStyle}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white shadow-sm border border-slate-200/60 flex items-center gap-1.5 select-none">
                    <VerdictIcon
                      className={`w-3.5 h-3.5 ${
                        item.verdict === Verdict.SUPPORTED
                          ? "text-emerald-600"
                          : item.verdict === Verdict.REFUTED
                          ? "text-rose-600"
                          : "text-amber-500"
                      }`}
                    />
                    {statusLabel} Claims
                  </span>
                  
                  {item.editorialCategory && item.editorialCategory !== EditorialCategory.ACCURATE && (
                    <span className="text-[10px] font-mono text-slate-500 italic bg-white/70 px-2 py-0.5 border border-slate-100 rounded shadow-sm">
                      {item.editorialCategory}
                    </span>
                  )}
                </div>
                
                <p className="text-slate-800 font-sans leading-relaxed text-sm">
                  {item.originalSentence}
                </p>
              </div>
            );
          })}
        </div>

        {/* Dynamic empty helper */}
        {sentences.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <p className="font-mono text-sm">No segmented paragraphs available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
