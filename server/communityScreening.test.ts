import { describe, expect, it, vi } from "vitest";
import { screenCommunityContent } from "./communityScreening";
import { imageSnapshot } from "./screeningMedia";
const input = { text: "Great squat session today!", images: [] };
describe("community screening decisions", () => {
  it("approves only an explicit unflagged provider response", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ results: [{ flagged: false }] }))
      );
    expect(await screenCommunityContent(input, "test-key", request)).toBe(
      "approved"
    );
    const body = JSON.parse(request.mock.calls[0][1].body);
    expect(body.input).toEqual([{ type: "text", text: input.text }]);
  });
  it("holds flagged content for a person, without deleting it", async () => {
    expect(
      await screenCommunityContent(
        input,
        "test-key",
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ results: [{ flagged: true }] }))
          )
      )
    ).toBe("held");
  });
  it.each([
    {},
    { results: [] },
    { results: [{ flagged: "false" }] },
    { results: [{ flagged: false }, { flagged: true }] },
  ])("fails closed on malformed results %j", async body => {
    expect(
      await screenCommunityContent(
        input,
        "test-key",
        vi.fn().mockResolvedValue(new Response(JSON.stringify(body)))
      )
    ).toBe("retry");
  });
  it("does not publish when credentials, provider, or network are unavailable", async () => {
    expect(await screenCommunityContent(input, "")).toBe("retry");
    expect(
      await screenCommunityContent(
        input,
        "test",
        vi.fn().mockRejectedValue(new Error("offline"))
      )
    ).toBe("retry");
    expect(
      await screenCommunityContent(
        input,
        "test",
        vi.fn().mockResolvedValue(new Response("", { status: 429 }))
      )
    ).toBe("retry");
  });
  it("holds unsupported media without sending it to the provider", async () => {
    const request = vi.fn();
    expect(
      await screenCommunityContent(
        { ...input, requiresHumanReview: true },
        "test",
        request
      )
    ).toBe("held");
    expect(request).not.toHaveBeenCalled();
  });
  it("sends the captured image bytes, not a mutable URL", async () => {
    const image = imageSnapshot(Buffer.from([255, 216, 255, 1, 2, 3]));
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ results: [{ flagged: false }] }))
      );
    await screenCommunityContent(
      { text: "", images: [image.dataUrl] },
      "test",
      request
    );
    expect(
      JSON.parse(request.mock.calls[0][1].body).input[0].image_url.url
    ).toBe(image.dataUrl);
  });
  it("rejects video, animation, unknown formats and oversized images", () => {
    expect(() => imageSnapshot(Buffer.from("video"))).toThrow();
    expect(() => imageSnapshot(Buffer.alloc(11 * 1024 * 1024))).toThrow();
    expect(() =>
      imageSnapshot(
        Buffer.concat([
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
          Buffer.from("acTL"),
        ])
      )
    ).toThrow();
  });
});
