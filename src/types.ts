/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Verdict {
  SUPPORTED = "Supported",
  REFUTED = "Refuted",
  INCONCLUSIVE = "Inconclusive"
}

export enum CredibilityClass {
  PRIMARY = "Primary (Government/Official)",
  AUTHORITATIVE = "Authoritative (Vetted News/Media)",
  EXPERT = "Expert Academic/NGO",
  FACT_CHECK = "Fact-Check Network Evidence",
  SECONDARY = "Secondary Web Source"
}

export enum EvidenceRelationship {
  SUPPORTING = "supporting",
  REFUTING = "refuting",
  NEUTRAL = "neutral"
}

export enum EditorialCategory {
  FACTUAL_ERROR = "Factual Error",
  MISLEADING_CONTEXT = "Misleading Context",
  LOADED_LANGUAGE = "Loaded/Propaganda Language",
  SPELLING_GRAMMAR = "Spelling/Grammar Issue",
  ACCURATE = "Accurate Statement"
}

export interface EvidenceSource {
  title: string;
  url: string;
  snippet: string;
  pubDate?: string;
  credibilityClass: CredibilityClass;
  relationship: EvidenceRelationship;
}

export interface ClaimResult {
  id: string;
  originalSentence: string;
  isCheckWorthy: boolean;
  claimSummary: string;
  verdict: Verdict;
  explanation: string;
  reasoningPath: string[];
  evidence: EvidenceSource[];
  suggestedCorrection: string;
  editorialCategory: EditorialCategory;
  searchEngineUsed?: string;
}

export interface SEORecommendations {
  headingsLayout: { original: string; suggestedH2: string; suggestedH3?: string }[];
  suggestedKeywords: { term: string; countNeeded: number; suggestedIntegrations: string }[];
  bulletedSummaries: string[];
  engagementCues: string[];
  authorityEnhancements: string[];
}

export interface FactCheckReport {
  originalContent: string;
  extractedTitle?: string;
  detectedLanguage: string;
  overallRating: number; // 0 to 100, where 100 is completely accurate
  overallSummary: string; // Editor's brief
  claims: ClaimResult[];
  seoRecommendations: SEORecommendations;
  readabilityMetric: string; // e.g., "Flesch-Kincaid: Grade 9 (Easy to Read)"
  propagandaRiskTier: "Low" | "Medium" | "High";
}

export interface FactCheckRequest {
  text?: string;
  url?: string;
}
