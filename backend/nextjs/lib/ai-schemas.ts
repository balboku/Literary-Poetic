import { z } from "zod";

// ─── Agentic Clarification ────────────────────────────────────────────────────
export const agenticClarificationSchema = z.object({
  needsClarification: z.boolean().default(false),
  clarificationQuestion: z.string().optional(),
});

// ─── Inspiration Rescue ───────────────────────────────────────────────────────

export const inspirationRequestSchema = z.object({
  topic: z.string().min(4).max(120000),
  contentFormat: z
    .enum(["longform", "short_video", "youtube", "campaign"])
    .default("longform"),
});

export const crossDomainFactSchema = z.object({
  title: z.string(),
  domain: z.string(),
  unexpectedLink: z.string(),
  firstSentenceHook: z.string(),
  contentAngle: z.string(),
  trendIntegration: z.string(),
  balboAside: z.string(),
});

export const storySeedSchema = z.object({
  title: z.string(),
  hook: z.string(),
  outline: z.array(z.string()),
  format: z.string(),
  visualCue: z.string(),
  imagePrompt: z.string(),
  trendIntegration: z.string(),
  riskAndFix: z.string(),
});

export const inspirationRescueSchema = agenticClarificationSchema.extend({
  balboOpening: z.string().optional(),
  crossDomainFacts: z.array(crossDomainFactSchema).optional(),
  storySeeds: z.array(storySeedSchema).optional(),
  balboClosing: z.string().optional(),
});

// ─── Data Story ─────────────────────────────────────────────────────────────

export const dataStoryRequestSchema = z.object({
  inputText: z.string().min(20).max(120000),
});

export const dataStoryVersionSchema = z.object({
  analogy: z.string(), // 【大叔的白話文翻譯】
  storyCopy: z.string(), // 【萬花筒故事文案】
  slogans: z.array(z.string()), // 【吸睛金句】
});

export const dataStorySchema = agenticClarificationSchema.extend({
  balboOpening: z.string().optional(),
  boringReality: z.string().optional(),
  balboTranslation: z.string().optional(),
  investorVersion: dataStoryVersionSchema.optional(),
  customerVersion: dataStoryVersionSchema.optional(),
  grandmaVersion: dataStoryVersionSchema.optional(),
  balboClosing: z.string().optional(),
});

// ─── Logic Compass ───────────────────────────────────────────────────────────

export const logicCompassRequestSchema = z.object({
  businessModel: z.string().min(20).max(120000),
  personaMask: z.enum(["vc", "hater", "balbo"]).default("balbo"),
});

export const sharpQuestionSchema = z.object({
  question: z.string(),
  balboHint: z.string(),
});

export const logicCompassSchema = agenticClarificationSchema.extend({
  balboOpening: z.string().optional(), // 高度肯定
  logicalContradictions: z.array(z.string()).optional(), // 【羅盤指針偏移】
  marketOptimismRisks: z.array(z.string()).optional(), // 【迷霧警報】
  doomScenario: z.string().optional(), // 【毀滅劇本】
  sharpQuestions: z.array(sharpQuestionSchema).optional(), // 【大叔的靈魂拷問】
  pivotSuggestion: z.string().optional(), // 救生圈：軸心轉向建議
  balboClosing: z.string().optional(), // 回覆結語
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type InspirationRequest = z.infer<typeof inspirationRequestSchema>;
export type InspirationRescueOutput = z.infer<typeof inspirationRescueSchema>;
export type DataStoryRequest = z.infer<typeof dataStoryRequestSchema>;
export type DataStoryOutput = z.infer<typeof dataStorySchema>;
export type LogicCompassRequest = z.infer<typeof logicCompassRequestSchema>;
export type LogicCompassOutput = z.infer<typeof logicCompassSchema>;
