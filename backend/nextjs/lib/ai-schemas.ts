import { z } from "zod";

export const inspirationRequestSchema = z.object({
  topic: z.string().min(4).max(3000),
  contentFormat: z
    .enum(["longform", "short_video", "youtube", "campaign"])
    .default("longform"),
  service: z.literal("inspiration_rescue").optional(),
});

export const crossDomainFactSchema = z.object({
  title: z.string(),
  domain: z.string(),
  unexpectedLink: z.string(),
  contentAngle: z.string(),
  balboAside: z.string(),
});

export const storySeedSchema = z.object({
  title: z.string(),
  hook: z.string(),
  outline: z.array(z.string()).min(3).max(3),
  format: z.string(),
  riskAndFix: z.string(),
});

export const inspirationRescueSchema = z.object({
  balboNote: z.string(),
  crossDomainFacts: z.array(crossDomainFactSchema).min(3).max(3),
  storySeeds: z.array(storySeedSchema).min(3).max(3),
});

export const dataStoryRequestSchema = z.object({
  inputText: z.string().min(20).max(120000),
  style: z
    .enum(["warm", "humorous", "fantasy", "fundraising", "pr", "concise"])
    .default("fundraising"),
});

export const dataStorySchema = z.object({
  balboOpening: z.string(),
  plainLanguageSummary: z.array(z.string()).min(3).max(5),
  storyCopy: z.string(),
  pitchDeckSlides: z
    .array(
      z.object({
        title: z.string(),
        bullets: z.array(z.string()).min(2).max(5),
      }),
    )
    .min(3)
    .max(3),
  pressReleaseVersion: z.string(),
  riskNotes: z.array(z.string()),
});

export const logicCompassRequestSchema = z.object({
  businessModel: z.string().min(20).max(120000),
});

export const logicCompassSchema = z.object({
  balboSummary: z.string(),
  riskScore: z.number().min(1).max(10),
  vulnerabilities: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high", "critical"]),
      issue: z.string(),
      whyItMatters: z.string(),
      sharpQuestion: z.string(),
      fix: z.string(),
    }),
  ),
  dataContradictions: z.array(z.string()),
  validationExperiments: z.array(z.string()).min(3).max(3),
  revisedDirection: z.array(z.string()).min(3).max(5),
  balboClosing: z.string(),
});

export type InspirationRequest = z.infer<typeof inspirationRequestSchema>;
export type InspirationRescueOutput = z.infer<typeof inspirationRescueSchema>;
export type DataStoryRequest = z.infer<typeof dataStoryRequestSchema>;
export type DataStoryOutput = z.infer<typeof dataStorySchema>;
export type LogicCompassRequest = z.infer<typeof logicCompassRequestSchema>;
export type LogicCompassOutput = z.infer<typeof logicCompassSchema>;
