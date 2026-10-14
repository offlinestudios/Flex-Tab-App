import { z } from "zod";

export type ScreeningInput = {
  text: string;
  images: string[];
  requiresHumanReview?: boolean;
};
export type ScreeningDecision = "approved" | "held" | "retry";
const responseSchema = z.object({
  results: z.array(z.object({ flagged: z.boolean() })).length(1),
});

// No private training history, emails, tokens, or identifiers are included in input.
// Enable only after the operator configures the service and privacy disclosure.
export async function screenCommunityContent(
  input: ScreeningInput,
  apiKey = process.env.COMMUNITY_SCREENING_API_KEY,
  request: typeof fetch = fetch
): Promise<ScreeningDecision> {
  if (
    input.requiresHumanReview ||
    input.images.length > 10 ||
    input.text.length > 20000
  )
    return "held";
  if (!apiKey) return "retry";
  if (!input.text.trim() && !input.images.length) return "approved";
  try {
    const response = await request("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [
          ...(input.text.trim() ? [{ type: "text", text: input.text }] : []),
          ...input.images.map(url => ({
            type: "image_url",
            image_url: { url },
          })),
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return "retry";
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) return "retry";
    return parsed.data.results[0].flagged ? "held" : "approved";
  } catch {
    return "retry";
  }
}
