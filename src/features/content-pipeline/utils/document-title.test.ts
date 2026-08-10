import { describe, expect, it } from "vitest";

import { documentTitleFromFilename } from "./document-title";

describe("documentTitleFromFilename", () => {
  it("uses the filename without its final extension", () => {
    expect(documentTitleFromFilename("week 5. Noi suy Spline.pdf")).toBe("week 5. Noi suy Spline");
    expect(documentTitleFromFilename("Chương 1.v2.docx")).toBe("Chương 1.v2");
  });

  it("normalizes paths and empty dotfiles safely", () => {
    expect(documentTitleFromFilename("C:\\uploads\\Nội suy.md")).toBe("Nội suy");
    expect(documentTitleFromFilename(".pdf")).toBe("Tài liệu");
  });
});
