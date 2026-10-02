import { describe, expect, it } from "vitest";
import {
  buildSearchParams,
  buildZeroResultsQuestion,
  conditionChips,
  formatPrice,
  parseSearchConditions,
} from "@/lib/property";

describe("formatPrice（万円表記）", () => {
  it("端数が無ければ整数の万円で表記する", () => {
    expect(formatPrice(80_000)).toBe("8万円");
    expect(formatPrice(32_800_000)).toBe("3,280万円");
  });

  it("端数があれば小数点以下最大2桁で表記し、末尾の0は省く", () => {
    expect(formatPrice(85_000)).toBe("8.5万円");
    expect(formatPrice(79_500)).toBe("7.95万円");
    expect(formatPrice(80_100)).toBe("8.01万円");
  });

  it("1億以上は億と万円に分けて表記する", () => {
    expect(formatPrice(120_000_000)).toBe("1億2,000万円");
    expect(formatPrice(100_000_000)).toBe("1億円");
  });

  it("1万円未満も崩れない", () => {
    expect(formatPrice(5_000)).toBe("0.5万円");
  });

  it("賃貸のときだけ末尾に /月 を付ける", () => {
    expect(formatPrice(80_000, "rent")).toBe("8万円/月");
    expect(formatPrice(32_800_000, "sale")).toBe("3,280万円");
    expect(formatPrice(80_000, undefined)).toBe("8万円");
  });
});

describe("parseSearchConditions / buildZeroResultsQuestion", () => {
  it("不正な値は未指定として扱う", () => {
    expect(
      parseSearchConditions({ type: "foo", minPrice: "abc", maxPrice: "71500", layout: " " }),
    ).toEqual({
      type: undefined,
      minPrice: undefined,
      maxPrice: 71500,
      layout: undefined,
      keyword: undefined,
    });
  });

  it("検索条件を自然文の質問にする", () => {
    const q = buildZeroResultsQuestion(
      parseSearchConditions({ type: "rent", maxPrice: "80000", layout: "2LDK", keyword: "ペット可" }),
    );
    expect(q).toBe(
      "賃貸・家賃8万円以下・2LDK・「ペット可」の条件で探しましたが見つかりませんでした。条件を緩めた提案をお願いします",
    );
  });
});

describe("sort（並び順）", () => {
  it("3つの値はそのまま解釈する", () => {
    for (const sort of ["newest", "price_asc", "price_desc"] as const) {
      expect(parseSearchConditions({ sort }).sort).toBe(sort);
    }
  });

  it("不正な値・空・未指定は undefined にする", () => {
    expect(parseSearchConditions({ sort: "foo" }).sort).toBeUndefined();
    expect(parseSearchConditions({ sort: "" }).sort).toBeUndefined();
    expect(parseSearchConditions({}).sort).toBeUndefined();
  });

  it("buildSearchParams に反映し、未指定なら含めない", () => {
    expect(buildSearchParams({ type: "rent", sort: "price_asc" }).toString()).toBe(
      "type=rent&sort=price_asc",
    );
    expect(buildSearchParams({ type: "rent" }).has("sort")).toBe(false);
  });

  it("conditionChips と 0件時の質問文には含めない", () => {
    expect(conditionChips({ sort: "newest" })).toEqual([]);
    expect(conditionChips({ type: "rent", sort: "newest" }).map((c) => c.key)).toEqual(["type"]);
    expect(buildZeroResultsQuestion({ sort: "newest" })).toBe("おすすめの物件を教えてください");
  });
});
