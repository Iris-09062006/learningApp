import { describe, expect, it } from "vitest";

import { chunkDocumentText, extractDocumentText } from "./document-extractor";

describe("document extraction", () => {
  it("normalizes UTF-8 text and creates stable chunks", async () => {
    const text = await extractDocumentText(
      Buffer.from("Tiêu đề\r\n\r\nNội dung bài học.\u0000"),
      "text/plain"
    );
    const chunks = chunkDocumentText(text);
    expect(text).toBe("Tiêu đề\n\nNội dung bài học.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ chunkIndex: 0, startOffset: 0 });
    expect(chunks[0].contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects empty documents", async () => {
    await expect(extractDocumentText(Buffer.from(" \n "), "text/markdown")).rejects.toMatchObject({
      code: "EMPTY_DOCUMENT",
    });
  });

  it("splits oversized paragraphs without losing text", () => {
    const text = "a".repeat(8_500);
    const chunks = chunkDocumentText(text);
    expect(chunks.map((chunk) => chunk.content).join("")).toBe(text);
    expect(chunks.every((chunk) => chunk.content.length <= 4_000)).toBe(true);
  });
});
