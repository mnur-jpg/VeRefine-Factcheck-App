/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Verdict,
  CredibilityClass,
  EvidenceRelationship,
  EditorialCategory,
  EvidenceSource,
  ClaimResult,
  SEORecommendations,
  FactCheckReport,
} from "./types";
import InLineArticle from "./components/InLineArticle";
import ClaimDetails from "./components/ClaimDetails";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  BookOpen,
  Settings,
  Flame,
  CornerDownRight,
  ShieldAlert,
  Sliders,
  Sparkle,
  Type as FontIcon,
  Check,
  Award,
  Maximize2,
  Minimize2,
  Trash2,
} from "lucide-react";

const PRESETS = [
  {
    title: "NASA Space Program Costs Claim",
    language: "English",
    text: "In a stunning declaration, the administration claimed that NASA received over 12% of the US Federal budget in 2024 to fund the lunar base. However, experts say that the agency is running on zero balance. Additionally, the Artemis program was allegedly canceled in late 2023. These announcements caused major waves across the scientific community."
  },
  {
    title: "WHO Pandemic Agreement Status",
    language: "English",
    text: "According to recent viral social posts, the World Health Organization (WHO) passed a new pandemic treaty in May 2025 that overrides all national constitutions. It is claimed that the WHO now has direct military authority to enforce lockdowns globally. Meanwhile, legal scholars argue this is a complete misinterpretation of the draft guidelines."
  },
  {
    title: "European Green Deal Emission Targets (ES)",
    language: "Spanish",
    text: "El Parlamento Europeo anunció que las emisiones de CO2 se redujeron en un 80% en España para el primer trimestre de 2025. Los activistas celebraron e indicaron que el Green Deal Europeo ya canceló todas las industrias fósiles en Madrid. Sin embargo, los informes oficiales del ministerio de transición ecológica indican que la reducción real de emisiones fue del 3.5%."
  }
];

export default function App() {
  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [isCopypasteExpanded, setIsCopypasteExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"auditor" | "seo">("auditor");

  // Derived statistics for copyblock
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;
  const paragraphCount = inputText.trim() ? inputText.split(/\n\s*\n/).filter(p => p.trim()).length : 0;

  // Flow State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0 });

  // Discovered Metadata
  const [metadata, setMetadata] = useState<{ title?: string; author?: string; date?: string }>({});
  const [detectedLanguage, setDetectedLanguage] = useState("English");
  const [readabilityIndex, setReadabilityIndex] = useState("");
  const [propagandaTier, setPropagandaTier] = useState<"Low" | "Medium" | "High">("Low");
  const [scoreAverage, setScoreAverage] = useState(100);
  const [editorsReviewSummary, setEditorsReviewSummary] = useState("");

  // Sentences listing
  const [sentences, setSentences] = useState<ClaimResult[]>([]);
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null);

  // Suggested corrections editable draft map
  const [editableCorrections, setEditableCorrections] = useState<Record<string, string>>({});

  // SEO Recommendations
  const [seoRecommend, setSeoRecommend] = useState<SEORecommendations | null>(null);

  // Errors feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // On page load, prefill the first preset
  useEffect(() => {
    setInputText(PRESETS[0].text);
  }, []);

  // Load a preset
  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setInputText(p.text);
    setInputUrl("");
    setErrorMessage(null);
  };

  // Run full verification pipeline
  const handleStartFactCheck = async () => {
    if (!inputText.trim() && !inputUrl.trim()) {
      setErrorMessage("Please enter an article URL or write/paste copy blocks to test.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSelectedSentenceId(null);
    setSentences([]);
    setSeoRecommend(null);

    try {
      // Stage 1: Ingestion
      setCurrentStage("Ingesting URL metadata and sanitizing editorial draft...");
      const ingestRes = await fetch("/api/factcheck/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, url: inputUrl }),
      });

      if (!ingestRes.ok) {
        const err = await ingestRes.json();
        throw new Error(err.error || "Failed to ingest webpage content safely.");
      }

      const ingData = await ingestRes.json();
      setMetadata(ingData.metadata || {});
      const activeText = ingData.content || inputText;
      
      // Update inputs with extracted clean text if scraping URL
      if (inputUrl) {
        setInputText(activeText);
      }

      // Stage 2: Fragment and analyze claim structures
      setCurrentStage("Parsing declarative candidate statements and check-worthiness...");
      const parseRes = await fetch("/api/factcheck/analyze-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeText }),
      });

      if (!parseRes.ok) {
        const err = await parseRes.json();
        throw new Error(err.error || "Claim breakdown algorithms failed.");
      }

      const parseData = await parseRes.json();
      setDetectedLanguage(parseData.detectedLanguage || "English");

      const structuralClaims: ClaimResult[] = parseData.sentences.map((sent: any, index: number) => ({
        id: `stmt-${index}`,
        originalSentence: sent.text,
        isCheckWorthy: sent.isCheckWorthy,
        claimSummary: sent.claimSummary || "",
        verdict: Verdict.INCONCLUSIVE,
        explanation: sent.isCheckWorthy
          ? "Auditing statement against live facts and academic register sources..."
          : "Evaluated as safe standard intro text statement/narrative overview.",
        reasoningPath: sent.isCheckWorthy ? ["Initiating web search pipeline..."] : ["Evaluated as standard prose"],
        evidence: [],
        suggestedCorrection: sent.text,
        editorialCategory: sent.editorialCategory || EditorialCategory.ACCURATE,
      }));

      setSentences(structuralClaims);

      // Checkworthy filter
      const verifyQueue = structuralClaims.filter(s => s.isCheckWorthy);
      setCurrentProgress({ current: 0, total: verifyQueue.length });

      // Stage 3: Ground claims sequentially to display active progress
      const auditedClaims: ClaimResult[] = [];

      for (let i = 0; i < structuralClaims.length; i++) {
        const c = structuralClaims[i];
        if (!c.isCheckWorthy) {
          auditedClaims.push(c);
          continue;
        }

        const currIdx = auditedClaims.filter(s => s.isCheckWorthy).length;
        setCurrentStage(`Auditing statement: "${c.originalSentence.slice(0, 35)}..."`);
        setCurrentProgress({ current: currIdx + 1, total: verifyQueue.length });

        try {
          const groundRes = await fetch("/api/factcheck/ground-claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              claimSummary: c.claimSummary,
              originalSentence: c.originalSentence,
            }),
          });

          if (groundRes.ok) {
            const groundData = await groundRes.json();
            const checkedClaim: ClaimResult = {
              ...c,
              verdict: groundData.verdict as Verdict,
              explanation: groundData.explanation,
              reasoningPath: groundData.reasoningPath || [],
              evidence: groundData.evidence || [],
            };
            auditedClaims.push(checkedClaim);
            // Dynamic progressive update for visual feedback
            setSentences([...auditedClaims, ...structuralClaims.slice(i + 1)]);
          } else {
            auditedClaims.push(c);
          }
        } catch (groundError) {
          console.error("Single claim grounding failed:", groundError);
          auditedClaims.push(c);
        }
      }

      // Stage 4: Global Editorial reviews and SEO suite
      setCurrentStage("Consolidating high-level E-E-A-T edits and calculating score metrics...");
      const editorRes = await fetch("/api/factcheck/editor-suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalContent: activeText,
          verifiedClaims: auditedClaims,
          language: parseData.detectedLanguage || "English",
        }),
      });

      if (!editorRes.ok) {
        const err = await editorRes.json();
        throw new Error(err.error || "Editorial optimizer pipeline failed");
      }

      const editorData = await editorRes.json();
      setScoreAverage(editorData.overallRating ?? 100);
      setReadabilityIndex(editorData.readabilityMetric || "Flesch index not ready");
      setPropagandaTier(editorData.propagandaRiskTier || "Low");
      setEditorsReviewSummary(editorData.overallSummary || "");
      setSeoRecommend(editorData.seoRecommendations || null);

      // Merge rewrites back into claims
      const finalSentences = auditedClaims.map((item) => {
        const correctionObj = (editorData.correctionsMap || []).find(
          (m: any) => m.originalSentence === item.originalSentence
        );
        return {
          ...item,
          suggestedCorrection: correctionObj ? correctionObj.suggestedRewrite : item.originalSentence,
        };
      });

      setSentences(finalSentences);

      // Create pre-filled editable correction status map
      const initialMap: Record<string, string> = {};
      finalSentences.forEach((s) => {
        initialMap[s.id] = s.suggestedCorrection;
      });
      setEditableCorrections(initialMap);

      // Automatically select first verified checkworthy claim to guide users
      const firstCheckworthy = finalSentences.find(s => s.isCheckWorthy);
      if (firstCheckworthy) {
        setSelectedSentenceId(firstCheckworthy.id);
      } else if (finalSentences.length > 0) {
        setSelectedSentenceId(finalSentences[0].id);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "A pipeline failure occurred during deep research.");
    } finally {
      setIsProcessing(false);
      setCurrentStage("");
    }
  };

  // Accept suggestions dynamically rewriting inline text
  const handleApplyCorrectionToDraft = (id: string) => {
    const writtenValue = editableCorrections[id];
    if (!writtenValue) return;

    setSentences((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            originalSentence: writtenValue,
            verdict: Verdict.SUPPORTED, // Set to green/supported once corrected
            editorialCategory: EditorialCategory.ACCURATE,
          };
        }
        return s;
      })
    );
  };

  const getVerdictCounts = () => {
    const verified = sentences.filter(s => s.isCheckWorthy);
    return {
      total: verified.length,
      supported: verified.filter(s => s.verdict === Verdict.SUPPORTED).length,
      refuted: verified.filter(s => s.verdict === Verdict.REFUTED).length,
      inconclusive: verified.filter(s => s.verdict === Verdict.INCONCLUSIVE).length,
    };
  };

  const selectedSentence = sentences.find((s) => s.id === selectedSentenceId) || null;
  const counts = getVerdictCounts();

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-800">
      
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ring-4 ring-slate-100">
              <Sparkle className="w-5.5 h-5.5 text-indigo-400 stroke-[1.75]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-display tracking-tight text-slate-900">
                  VeRefine
                </h1>
                <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-100/50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Grounding API v3.5
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Semi-automated legal, legislative, and institutional database fact-checking assistant.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <span className="text-xs text-slate-400 hidden md:inline font-mono">
              Status: <strong className="text-slate-650">SYSTEMS READY</strong>
            </span>
            <button
              onClick={() => {
                setInputText("");
                setInputUrl("");
                setSentences([]);
                setSelectedSentenceId(null);
                setSeoRecommend(null);
                setErrorMessage(null);
              }}
              className="p-1.5 rounded-lg border border-slate-250 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-xs flex items-center gap-1 cursor-pointer font-medium"
              title="Reset workspace back to draft mode"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Preset Header Choices always available */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500 stroke-[2]" />
                Select a Curated Sample Draft to Verify
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Quickly audit realistic multilingual claims containing mixed truths, rumors, and dates without finding your own.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectPreset(preset)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  {preset.title} ({preset.language})
                </button>
              ))}
            </div>
          </div>

          {/* User Input controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-100">
            <div className="lg:col-span-4 flex flex-col space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Ingest from URL
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="url"
                  placeholder="Paste news, ministry, or tweet URL to scrape..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  or Paste Copy Blocks
                </label>
                
                <div className="flex items-center gap-2">
                  {inputText && (
                    <button
                      onClick={() => setInputText("")}
                      className="text-[10px] font-mono text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-50 cursor-pointer"
                      title="Clear text area"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsCopypasteExpanded(!isCopypasteExpanded)}
                    className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-indigo-50 cursor-pointer"
                    title={isCopypasteExpanded ? "Collapse block" : "Expand block"}
                  >
                    {isCopypasteExpanded ? (
                      <>
                        <Minimize2 className="w-3 h-3" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3" />
                        Expand Box
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <textarea
                    rows={isCopypasteExpanded ? 10 : 3}
                    placeholder="Paste declarative claims, news text, or social reports..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!!inputUrl}
                    className="flex-1 px-4 py-2.5 text-xs border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans disabled:opacity-50 resize-y min-h-[64px]"
                  />
                  
                  <button
                    onClick={handleStartFactCheck}
                    disabled={isProcessing}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer self-start h-[42px] ${
                      isProcessing
                        ? "bg-indigo-50 border border-indigo-200 text-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {isProcessing ? "Processing..." : "Verify Content"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {inputText && !inputUrl && (
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono px-1">
                    <span>
                      Words: <strong className="text-slate-600">{wordCount}</strong>
                    </span>
                    <span>
                      Characters: <strong className="text-slate-600">{charCount}</strong>
                    </span>
                    <span>
                      Paragraphs: <strong className="text-slate-600">{paragraphCount}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Display feedback error messages */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-850 text-xs flex items-center gap-2.5 animate-fade-in">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Dynamic Loading Overlay Phase Indicator */}
        {isProcessing && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4 animate-fade-in py-16">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <Sparkles className="w-5 h-5 text-indigo-500 absolute animate-pulse" />
            </div>
            
            <div className="space-y-1.5 max-w-lg">
              <h4 className="text-sm font-bold font-display text-slate-800 uppercase tracking-wide">
                Executing Intelligent Fact-Checking Engine
              </h4>
              <p className="text-slate-500 text-xs font-mono bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg italic">
                {currentStage}
              </p>
              
              {currentProgress.total > 0 && (
                <div className="space-y-1 pt-2">
                  <div className="w-64 bg-slate-100 rounded-full h-1.5 mx-auto overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 transition-all duration-350"
                      style={{ width: `${(currentProgress.current / currentProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">
                    Retrieving grounding evidence: {currentProgress.current} OF {currentProgress.total} checkworthy claims processed
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Workspace Panel */}
        {sentences.length > 0 && !isProcessing && (
          <div className="space-y-6">
            
            {/* Consolidated Editor Metrics & Brief */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Verdict score meter */}
              <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono text-cyan-700 tracking-wider uppercase mb-1.5 font-bold">
                    OFFICIAL FACTUAL INDEX
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900 font-display">
                      {scoreAverage}
                    </span>
                    <span className="text-sm text-slate-400 font-semibold">/100</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Calculated index based on verified statements from authority ministries databases.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center mt-4">
                  <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/40">
                    <span className="text-sm font-bold text-emerald-700 block">{counts.supported}</span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">Correct</span>
                  </div>
                  <div className="bg-rose-50/55 p-2 rounded-lg border border-rose-100/40">
                    <span className="text-sm font-bold text-rose-700 block">{counts.refuted}</span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">Flaws</span>
                  </div>
                  <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100/40">
                    <span className="text-sm font-bold text-amber-700 block">{counts.inconclusive}</span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">Unvetted</span>
                  </div>
                </div>
              </div>

              {/* Editor-in-Chief Briefing Column */}
              <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-mono text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-slate-700 stroke-[1.75]" />
                      Editor's Column Column Brief
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold">
                        Lang: {detectedLanguage}
                      </span>
                      <span className={`text-[10px] font-mono border px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                        propagandaTier === "High"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : propagandaTier === "Medium"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        <Flame className="w-3" />
                        BIAS: {propagandaTier}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-650 leading-relaxed italic whitespace-pre-wrap">
                    "{editorsReviewSummary}"
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                  <span>Readability Grade: <strong className="text-slate-750">{readabilityIndex}</strong></span>
                  <span>E-E-A-T Schema: Verified</span>
                </div>
              </div>

            </div>

            {/* Workplace Selector Navigation */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab("auditor")}
                className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "auditor"
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sliders className="w-4 h-4" />
                Statements Auditor
              </button>
              
              <button
                onClick={() => setActiveTab("seo")}
                className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "seo"
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                SEO & Editors Blueprint
              </button>
            </div>

            {/* Split Screen Auditor workspace */}
            {activeTab === "auditor" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-0.5">
                
                {/* Left Workspace (Original Text Draft) */}
                <div className="lg:col-span-7 flex flex-col h-[650px]">
                  <InLineArticle
                    sentences={sentences}
                    selectedSentenceId={selectedSentenceId}
                    onSelectSentence={(id) => {
                      setSelectedSentenceId(id);
                      setErrorMessage(null);
                    }}
                    metadata={metadata}
                  />
                </div>

                {/* Right Workspace (Grounding, Evidence & Editor Correction box) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-y-auto h-[650px] flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-xs font-mono text-slate-400 tracking-wider uppercase">
                        Evidence Grounding Panel
                      </h3>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        Statement Ref: {selectedSentenceId || "None Selected"}
                      </span>
                    </div>

                    <ClaimDetails claim={selectedSentence} />
                  </div>

                  {/* Accept Suggested Corrections Editor Tray */}
                  {selectedSentence && selectedSentence.isCheckWorthy && (
                    <div className="border-t border-slate-100 pt-5 mt-6 space-y-3 bg-indigo-50/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-750 flex items-center gap-1.5 uppercase tracking-wide font-display">
                          <FontIcon className="w-3.5 h-3.5 text-indigo-500 stroke-[2.5]" />
                          Interactive Correction Drawer
                        </span>
                        
                        {selectedSentence.editorialCategory !== EditorialCategory.ACCURATE && (
                          <span className="text-[10px] font-mono text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase font-bold">
                            {selectedSentence.editorialCategory}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-slate-400">
                          Edit suggestions if needed:
                        </label>
                        <textarea
                          rows={2.5}
                          className="w-full p-2.5 text-xs text-slate-700 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg outline-none font-sans"
                          value={editableCorrections[selectedSentence.id] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditableCorrections((prev) => ({
                              ...prev,
                              [selectedSentence.id]: val,
                            }));
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-1">
                        <button
                          onClick={() => {
                            // Restore back to original suggestion
                            setEditableCorrections((prev) => ({
                              ...prev,
                              [selectedSentence.id]: selectedSentence.suggestedCorrection,
                            }));
                          }}
                          className="text-[10px] font-mono text-slate-450 hover:text-slate-650 cursor-pointer transition-colors"
                        >
                          Revoke edits
                        </button>

                        <button
                          onClick={() => handleApplyCorrectionToDraft(selectedSentence.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Apply Suggestion
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* SEO & Editors diagnostics column blueprint */}
            {activeTab === "seo" && (
              <div className="animate-fade-in space-y-6">
                
                {seoRecommend ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-0.5">
                    
                    {/* Editorial H2 Heading Layouts suggestions */}
                    <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 font-display flex items-center gap-2">
                          <FontIcon className="w-4 h-4 text-emerald-600 stroke-[2]" />
                          E-E-A-T Headings Layout suggestions (SEO Optimized)
                        </h3>
                        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-2 py-0.5 rounded font-bold uppercase">
                          Editor Recommended
                        </span>
                      </div>

                      <div className="space-y-4">
                        {seoRecommend.headingsLayout?.map((heading, hIdx) => (
                          <div key={hIdx} className="bg-slate-50/55 p-4 rounded-xl border border-slate-200/60 flex gap-4">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {hIdx + 1}
                            </span>
                            
                            <div className="space-y-2 flex-1">
                              <div>
                                <span className="text-[10px] font-mono text-slate-450 uppercase block">Focus Section Original Target:</span>
                                <h4 className="text-sm font-bold text-slate-500 italic block">
                                  {heading.original}
                                </h4>
                              </div>

                              <div className="flex items-start gap-1 pb-1">
                                <CornerDownRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase block tracking-wider">Suggested H2 Heading:</span>
                                  <h4 className="text-base font-extrabold text-slate-800 font-display tracking-tight leading-snug">
                                    {heading.suggestedH2}
                                  </h4>
                                </div>
                              </div>

                              {heading.suggestedH3 && (
                                <div className="pl-5 flex items-start gap-1">
                                  <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[10px] font-mono text-indigo-600 uppercase block tracking-wider">Suggested H3 Subhead:</span>
                                    <p className="text-xs font-semibold text-slate-650 font-sans leading-relaxed">
                                      {heading.suggestedH3}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Keywords integrations blueprint and authority advice */}
                    <div className="md:col-span-5 space-y-6">
                      
                      {/* Keyword distribution targeting */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="pb-3 border-b border-slate-100">
                          <h3 className="text-sm font-semibold text-slate-800 font-display flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            Audience Intent Keywords
                          </h3>
                        </div>

                        <div className="space-y-4">
                          {seoRecommend.suggestedKeywords?.map((kw, kwIdx) => (
                            <div key={kwIdx} className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-700 font-mono bg-white border border-slate-150 px-2 py-0.5 rounded">
                                  "{kw.term}"
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase">
                                  Quota: <strong className="text-slate-700">+{kw.countNeeded} times</strong>
                                </span>
                              </div>
                              <p className="text-xs text-slate-550 leading-relaxed italic border-t border-dashed border-slate-200/40 pt-2 bg-white/40 px-2 py-1 rounded">
                                <strong className="text-[10px] uppercase font-mono text-slate-400 block not-italic leading-none mb-1">integration example:</strong>
                                "{kw.suggestedIntegrations}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* E-E-A-T credentials and engagement enhancers */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="pb-3 border-b border-slate-100">
                          <h3 className="text-sm font-semibold text-slate-800 font-display flex items-center gap-2">
                            <Award className="w-4 h-4 text-teal-600" />
                            Academic & E-E-A-T Authority Enhancements
                          </h3>
                        </div>

                        <ul className="text-xs text-slate-650 space-y-2.5">
                          {seoRecommend.authorityEnhancements?.map((item, idx) => (
                            <li key={idx} className="flex gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Engagement cues */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="pb-3 border-b border-slate-100">
                          <h3 className="text-sm font-semibold text-slate-800 font-display flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            User Experience Engagement Cues
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {seoRecommend.engagementCues?.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-xs leading-relaxed font-sans text-slate-650">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 my-10 font-mono text-xs">
                    SEO blueprint is generated concurrently upon completing the first deep audit workspace sweep.
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* Empty state standard container guide */}
        {sentences.length === 0 && !isProcessing && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm text-center max-w-xl mx-auto space-y-5 py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <Sparkle className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Begin Fact-Checking Content
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Paste an editorial draft, social media update, or provide an active news URL. VeRefine is integrated to execute multi-step research grounded validation.
              </p>
            </div>

            <button
              onClick={handleStartFactCheck}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors inline-flex items-center gap-2"
            >
              Verify Default Preset Claim
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="border-t border-slate-200 bg-white/50 text-slate-400 py-6 text-center text-xs mt-12 font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 VeRefine Investigator Workspace. For journalists & editorial staff.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600">Privacy Register</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-600">Primary Database List</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-600">E-E-A-T Methodologies</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
