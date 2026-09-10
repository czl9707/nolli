// apps/video-gen/src/components/EndLockup.test.tsx
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ComponentProps } from "react";

// useCurrentFrame() throws outside a registered composition — pin the frame to
// the END beat's first frame, keep staticFile a plain path, and pass <Img>
// through to a plain <img> (it assigns src in a browser-only layout effect).
vi.mock("remotion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("remotion")>();
  return {
    ...actual,
    useCurrentFrame: () => 0,
    staticFile: (path: string) => path,
    Img: (props: ComponentProps<"img">) => <img {...props} />,
  };
});

import { EndLockup } from "./EndLockup";

describe("EndLockup", () => {
  it("renders lead line, icon and wordmark", () => {
    const html = renderToString(<EndLockup />);
    // SoftBlurIn splits text into per-char spans — strip tags before matching.
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toContain("Explore more in");
    expect(html).toContain("favicon.svg");
    expect(text).toContain("Nolli");
  });
});
