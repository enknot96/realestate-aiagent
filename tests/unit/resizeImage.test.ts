import { describe, expect, it } from "vitest";
import { fitWithin, MAX_EDGE_PX } from "@/components/property-import/resize-image";

describe("fitWithin（送信前の縮小寸法）", () => {
  it("長辺が上限以下ならそのまま", () => {
    expect(fitWithin(1600, 1200)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(MAX_EDGE_PX, 1000)).toEqual({ width: MAX_EDGE_PX, height: 1000 });
  });

  it("横長は横幅を、縦長は高さを上限に合わせ、縦横比を保つ", () => {
    // スマホの写真（4032x3024）→ 2000x1500
    expect(fitWithin(4032, 3024)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1500, height: 2000 });
  });
});
