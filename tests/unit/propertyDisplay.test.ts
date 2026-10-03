import { describe, expect, it } from "vitest";
import {
  buildOverviewRows,
  formatAccess,
  formatBuiltYearMonth,
  propertyKindLabel,
  summarizeArea,
  summarizeSpec,
  type PropertySummary,
} from "@/lib/property";

const base: PropertySummary = {
  id: 1,
  type: "sale",
  title: "物件",
  description: null,
  price: 32_800_000,
  layout: null,
  area: null,
  address: "兵庫県西宮市みらい町1-2-3",
};

const land: PropertySummary = { ...base, saleKind: "land", landArea: "82.40", privateRoadArea: "0.00" };
const house: PropertySummary = {
  ...base,
  saleKind: "used_house",
  layout: "4LDK",
  landArea: "120.30",
  buildingArea: "98.50",
  privateRoadArea: "5.20",
  builtYearMonth: "2003-03",
  nearestStation: "夙川",
  walkMinutes: 8,
};
const mansion: PropertySummary = {
  ...base,
  saleKind: "used_mansion",
  layout: "3LDK",
  area: "70.30",
  balconyArea: "9.80",
  floorNumber: 9,
  floorCount: 15,
  builtYearMonth: "2010-11",
  managementFee: 14500,
  repairReserveFee: 12000,
  managementType: "全部委託・日勤",
};
const rent: PropertySummary = { ...base, type: "rent", price: 80_000, layout: "2LDK", area: "55.00" };

describe("propertyKindLabel", () => {
  it("saleKind があればその表示名、無ければ賃貸/売買", () => {
    expect(propertyKindLabel(mansion)).toBe("中古マンション");
    expect(propertyKindLabel(land)).toBe("売地");
    expect(propertyKindLabel({ ...base, saleKind: null })).toBe("売買");
    expect(propertyKindLabel(rent)).toBe("賃貸");
    expect(propertyKindLabel({ ...base, saleKind: "unknown" })).toBe("売買");
  });
});

describe("summarizeArea / summarizeSpec", () => {
  it("種別ごとの面積の要約", () => {
    expect(summarizeArea(land)).toBe("土地 82.40㎡");
    expect(summarizeArea(house)).toBe("土地 120.30㎡ / 建物 98.50㎡");
    expect(summarizeArea({ ...house, buildingArea: null })).toBe("土地 120.30㎡");
    expect(summarizeArea(mansion)).toBe("70.30㎡");
    expect(summarizeArea(rent)).toBe("55.00㎡");
  });

  it("種別なしの売買は専有面積と断定しない", () => {
    expect(summarizeArea({ ...base, saleKind: null, area: "50.00" })).toBe("面積 50.00㎡");
  });

  it("値が無ければ空、旧形式（項目なし）でも壊れない", () => {
    expect(summarizeArea(base)).toBe("");
    expect(summarizeArea({ ...rent, area: null })).toBe("");
  });

  it("間取りと面積を ' / ' でつなぐ。売地は面積だけ。どちらも無ければ -", () => {
    expect(summarizeSpec(mansion)).toBe("3LDK / 70.30㎡");
    expect(summarizeSpec(land)).toBe("土地 82.40㎡");
    expect(summarizeSpec(base)).toBe("-");
  });
});

describe("formatAccess", () => {
  it("駅名と徒歩分", () => {
    expect(formatAccess({ nearestStation: "阿佐ヶ谷", walkMinutes: 6 })).toBe("阿佐ヶ谷駅 徒歩6分");
  });
  it("accessNote を優先する", () => {
    expect(
      formatAccess({ nearestStation: "八王子", walkMinutes: 1, accessNote: "八王子駅からバス5分、停歩1分" }),
    ).toBe("八王子駅からバス5分、停歩1分");
  });
  it("無ければ null（徒歩分だけでも null）", () => {
    expect(formatAccess(base)).toBeNull();
    expect(formatAccess({ nearestStation: "夙川" })).toBeNull();
  });
});

describe("formatBuiltYearMonth", () => {
  it("YYYY-MM を年月表記にする", () => {
    expect(formatBuiltYearMonth("2003-03")).toBe("2003年3月");
    expect(formatBuiltYearMonth("2010-11")).toBe("2010年11月");
  });
  it("無い・不正なら null", () => {
    expect(formatBuiltYearMonth(null)).toBeNull();
    expect(formatBuiltYearMonth(undefined)).toBeNull();
    expect(formatBuiltYearMonth("2003")).toBeNull();
  });
});

describe("buildOverviewRows", () => {
  const labels = (p: PropertySummary) => buildOverviewRows(p).map((r) => r.label);
  const value = (p: PropertySummary, label: string) => buildOverviewRows(p).find((r) => r.label === label)?.value;

  it("売地", () => {
    expect(labels(land)).toEqual(["種別", "価格", "所在地", "交通", "土地面積", "私道負担面積"]);
    expect(value(land, "種別")).toBe("売地");
    expect(value(land, "価格")).toBe("3,280万円");
    expect(value(land, "土地面積")).toBe("82.40㎡");
    expect(value(land, "私道負担面積")).toBe("なし");
  });

  it("私道負担: 正の値は面積、null は -", () => {
    expect(value(house, "私道負担面積")).toBe("5.20㎡");
    expect(value({ ...land, privateRoadArea: null }, "私道負担面積")).toBe("-");
  });

  it("戸建", () => {
    expect(labels(house)).toEqual([
      "種別", "価格", "所在地", "交通", "間取り", "土地面積", "建物面積", "私道負担面積", "築年月",
    ]);
    expect(value(house, "交通")).toBe("夙川駅 徒歩8分");
    expect(value(house, "築年月")).toBe("2003年3月");
  });

  it("中古マンション", () => {
    expect(labels(mansion)).toEqual([
      "種別", "価格", "所在地", "交通", "間取り", "専有面積", "バルコニー面積", "所在階", "築年月",
      "管理費", "修繕積立金", "管理形態",
    ]);
    expect(value(mansion, "所在階")).toBe("9階 / 15階建");
    expect(value(mansion, "管理費")).toBe("14,500円/月");
    expect(value(mansion, "修繕積立金")).toBe("12,000円/月");
    expect(value(mansion, "管理形態")).toBe("全部委託・日勤");
  });

  it("賃貸: 築年月は値があるときだけ追加", () => {
    expect(labels(rent)).toEqual(["種別", "価格", "所在地", "交通", "間取り", "専有面積"]);
    expect(value(rent, "価格")).toBe("8万円/月");
    expect(labels({ ...rent, builtYearMonth: "2015-04" }).at(-1)).toBe("築年月");
  });

  it("種別なしの売買は 間取り / 面積", () => {
    const p = { ...base, saleKind: null, layout: "2LDK", area: "50.00" };
    expect(labels(p)).toEqual(["種別", "価格", "所在地", "交通", "間取り", "面積"]);
    expect(value(p, "種別")).toBe("売買");
    expect(value(p, "面積")).toBe("50.00㎡");
  });

  it("旧形式（新項目なし）でも値の無い行は - で残る", () => {
    expect(value(mansion, "交通")).toBe("-");
    const old = { ...mansion, floorNumber: undefined, floorCount: undefined, managementFee: undefined };
    expect(value(old, "所在階")).toBe("-");
    expect(value(old, "管理費")).toBe("-");
  });
});
