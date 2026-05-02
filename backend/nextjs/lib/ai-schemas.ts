import { z } from "zod";

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
  balboAside: z.string(),
});

export const storySeedSchema = z.object({
  title: z.string(),
  hook: z.string(),
  outline: z.array(z.string()).min(3).max(3),
  format: z.string(),
  visualCue: z.string(),
  riskAndFix: z.string(),
});

export const inspirationRescueSchema = z.object({
  balboOpening: z.string(),
  crossDomainFacts: z.array(crossDomainFactSchema).min(3).max(3),
  storySeeds: z.array(storySeedSchema).min(3).max(3),
  balboClosing: z.string(),
});

// ─── Data Story ─────────────────────────────────────────────────────────────

export const dataStoryRequestSchema = z.object({
  inputText: z.string().min(20).max(120000),
  style: z.string().default("一般大眾"),
});

export const dataStorySchema = z.object({
  balboOpening: z.string(),
  boringReality: z.string(),
  balboTranslation: z.string(),
  analogy: z.string(), // 【大叔的白話文翻譯】
  storyCopy: z.string(), // 【萬花筒故事文案】
  slogans: z.array(z.string()).min(1).max(2), // 【吸睛金句】
  balboClosing: z.string(),
});

// ─── Logic Compass ───────────────────────────────────────────────────────────

export const logicCompassRequestSchema = z.object({
  businessModel: z.string().min(20).max(120000),
});

export const sharpQuestionSchema = z.object({
  question: z.string(),
  balboHint: z.string(),
});

export const logicCompassSchema = z.object({
  balboOpening: z.string(), // 高度肯定
  logicalContradictions: z.array(z.string()).min(1), // 【羅盤指針偏移】
  marketOptimismRisks: z.array(z.string()).min(1), // 【迷霧警報】
  sharpQuestions: z.array(sharpQuestionSchema).min(3).max(3), // 【大叔的靈魂拷問】
  pivotSuggestion: z.string(), // 救生圈：軸心轉向建議
  balboClosing: z.string(), // 回覆結語
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type InspirationRequest = z.infer<typeof inspirationRequestSchema>;
export type InspirationRescueOutput = z.infer<typeof inspirationRescueSchema>;
export type DataStoryRequest = z.infer<typeof dataStoryRequestSchema>;
export type DataStoryOutput = z.infer<typeof dataStorySchema>;
export type LogicCompassRequest = z.infer<typeof logicCompassRequestSchema>;
export type LogicCompassOutput = z.infer<typeof logicCompassSchema>;
