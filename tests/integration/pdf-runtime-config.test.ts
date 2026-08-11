import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import packageJson from "../../package.json";

describe("production PDF extraction runtime configuration", () => {
  it("pins the Vercel runtime to Node.js 22.x", () => {
    expect(packageJson.engines.node).toBe("22.x");
  });

  it("traces the runtime-selected Linux canvas binding for the extraction route", () => {
    const routeIncludes = nextConfig.outputFileTracingIncludes?.[
      "/api/admin/content-sources/*/extract"
    ];

    expect(routeIncludes).toEqual(expect.arrayContaining([
      "node_modules/@napi-rs/canvas/**/*",
      "node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
      "node_modules/pdf-parse/**/*",
      "node_modules/pdfjs-dist/**/*",
    ]));
  });
});
