import { describe, expect, it } from "vitest";
import {
  calcLoanAmount,
  calcMonthlyPayment,
  effectiveYears,
  simulateMortgage,
  type SimulateMortgageOutput,
} from "@/lib/mortgage";

// 期待値は、元利均等の公式を手元（Python）で別途計算した値
//   M = P × r × (1+r)^n / ((1+r)^n − 1)、P = M × ((1+r)^n − 1) / (r × (1+r)^n)
//   r = 年利 / 12、n = 年数 × 12。月々は円未満切り上げ、借入額は1万円未満切り捨て

function ok(result: ReturnType<typeof simulateMortgage>): SimulateMortgageOutput {
  if ("error" in result) throw new Error(`エラーが返りました: ${result.error.code}`);
  return result;
}

describe("calcMonthlyPayment（借入額→月々の返済額）", () => {
  it("3000万円・年1.2%・35年 → 87,510.69円 を切り上げて87,511円", () => {
    expect(calcMonthlyPayment(30_000_000, 1.2, 35)).toBe(87_511);
  });

  it("3000万円・年3.8%・35年 → 129,257.61円 を切り上げて129,258円", () => {
    expect(calcMonthlyPayment(30_000_000, 3.8, 35)).toBe(129_258);
  });

  it("金利0%は P / n（1200万円・10年 → 120ヶ月で10万円ちょうど。繰り上がらない）", () => {
    expect(calcMonthlyPayment(12_000_000, 0, 10)).toBe(100_000);
    // 割り切れない場合は切り上げ（1000万円 ÷ 35年=420回 → 23,809.52円 → 23,810円）
    expect(calcMonthlyPayment(10_000_000, 0, 35)).toBe(23_810);
  });
});

describe("calcLoanAmount（月々の返済額→借入額）", () => {
  it("月10万円・年1.2%・35年 → 34,281,527円 を1万円未満切り捨てて3,428万円", () => {
    expect(calcLoanAmount(100_000, 1.2, 35)).toBe(34_280_000);
  });

  it("月10万円・年3.8%・35年 → 23,209,464円 を切り捨てて2,320万円", () => {
    expect(calcLoanAmount(100_000, 3.8, 35)).toBe(23_200_000);
  });

  it("金利0%は M × n（月10万円・10年 → 1200万円ちょうど）", () => {
    expect(calcLoanAmount(100_000, 0, 10)).toBe(12_000_000);
  });

  it("往復: 借入額→月々→借入額 で、切り捨ての分（1万円未満）しか減らない", () => {
    for (const rate of [0, 1.2, 3.8]) {
      const monthly = calcMonthlyPayment(30_000_000, rate, 35);
      const back = calcLoanAmount(monthly, rate, 35);
      // 月々を切り上げているので、返ってくる借入額は元の額以上で、せいぜい1万円分の切り捨て差
      expect(back).toBeGreaterThanOrEqual(30_000_000 - 10_000);
      expect(back).toBeLessThanOrEqual(30_000_000 + 10_000 * 2);
    }
  });
});

describe("simulateMortgage（入力→変動・固定の2シナリオ）", () => {
  it("scenariosは常に[変動, 固定]の2要素で、既定金利は1.2%と3.8%", () => {
    const out = ok(simulateMortgage({ loanAmount: 30_000_000 }));
    expect(out.scenarios.map((s) => [s.kind, s.rate])).toEqual([
      ["variable", 1.2],
      ["fixed", 3.8],
    ]);
    expect(out.years).toBe(35);
    expect(out.rateAsOf).toBe("2026年10月");
    expect(out.sources.length).toBeGreaterThanOrEqual(2);
    expect(out.note).toContain("参考値");
  });

  it("金利を指定すると既定値を上書きする", () => {
    const out = ok(simulateMortgage({ loanAmount: 30_000_000, variableRate: 0.5, fixedRate: 2 }));
    expect(out.scenarios.map((s) => s.rate)).toEqual([0.5, 2]);
  });

  it("借入額から: 総返済額＝月々×回数、総利息＝総返済額−借入額", () => {
    const out = ok(simulateMortgage({ loanAmount: 30_000_000 }));
    const variable = out.scenarios[0].fromLoanAmount!;
    expect(variable.monthlyPayment).toBe(87_511);
    expect(variable.totalPayment).toBe(87_511 * 420);
    expect(variable.totalInterest).toBe(87_511 * 420 - 30_000_000);
    // 指定していない入力のブロックは含まれない
    expect(out.scenarios[0].fromMonthlyPayment).toBeUndefined();
    expect(out.scenarios[0].fromIncome).toBeUndefined();
  });

  it("月々の返済額から: 借入額は1万円未満切り捨て、総利息は切り捨て後の借入額との差", () => {
    const out = ok(simulateMortgage({ monthlyPayment: 100_000 }));
    const [variable, fixed] = out.scenarios.map((s) => s.fromMonthlyPayment!);
    expect(variable.loanAmount).toBe(34_280_000);
    expect(variable.totalPayment).toBe(100_000 * 420);
    expect(variable.totalInterest).toBe(42_000_000 - 34_280_000);
    expect(fixed.loanAmount).toBe(23_200_000);
  });

  it("年収500万円（35%）: 審査上限は審査金利で、無理のない目安は適用金利で計算し、審査上限で頭打ちにする", () => {
    // 審査上限: 500万 × 0.35 ÷ 12 = 145,833.3 → 切り捨て145,833円
    //   変動: 審査金利 max(1.2, 3.5) = 3.5% → 35,285,822円 → 3,528万円
    //   固定: 審査金利 max(3.8, 3.5) = 3.8% → 33,847,058円 → 3,384万円
    // 無理のない目安: 500万 × 0.25 ÷ 12 = 104,166.6 → 104,166円
    //   変動1.2% → 3,570万円 だが審査上限3,528万円を超えるので頭打ち（月々は3,528万円を1.2%で借りた額）
    //   固定3.8% → 24,176,371円 → 2,417万円（頭打ちなし）
    const out = ok(simulateMortgage({ annualIncome: 5_000_000 }));
    expect(out.scenarios[0].fromIncome).toEqual({
      annualIncome: 5_000_000,
      screeningRatio: 0.35,
      screeningRate: 3.5,
      screeningMonthly: 145_833,
      screeningMaxLoan: 35_280_000,
      comfortableRatio: 0.25,
      comfortableMaxLoan: 35_280_000,
      comfortableMonthly: 102_913,
      comfortableCapped: true,
    });
    const fixed = out.scenarios[1].fromIncome!;
    expect(fixed.screeningRate).toBe(3.8);
    expect(fixed.screeningMaxLoan).toBe(33_840_000);
    expect(fixed.comfortableMaxLoan).toBe(24_170_000);
    expect(fixed.comfortableCapped).toBe(false);
  });

  it("無理のない目安は、どの年収・金利でも審査上限を超えない", () => {
    for (const annualIncome of [2_500_000, 3_990_000, 4_000_000, 6_000_000, 12_000_000]) {
      for (const scenario of ok(simulateMortgage({ annualIncome })).scenarios) {
        const income = scenario.fromIncome!;
        expect(income.comfortableMaxLoan).toBeLessThanOrEqual(income.screeningMaxLoan);
      }
    }
  });

  it("適用金利が審査金利より高ければ、審査上限は適用金利で計算する", () => {
    const income = ok(simulateMortgage({ annualIncome: 5_000_000, variableRate: 4.5 })).scenarios[0]
      .fromIncome!;
    expect(income.screeningRate).toBe(4.5);
  });

  it("年収400万円の境界: 399万円は30%、400万円ちょうどは35%", () => {
    // 399万 × 0.30 ÷ 12 = 99,750円 → 審査金利3.5%・35年で 24,135,557円 → 2,413万円
    const below = ok(simulateMortgage({ annualIncome: 3_990_000 })).scenarios[0].fromIncome!;
    expect(below.screeningRatio).toBe(0.3);
    expect(below.screeningMonthly).toBe(99_750);
    expect(below.screeningMaxLoan).toBe(24_130_000);

    // 400万 × 0.35 ÷ 12 = 116,666.6 → 116,666円 → 28,228,561円 → 2,822万円
    const at = ok(simulateMortgage({ annualIncome: 4_000_000 })).scenarios[0].fromIncome!;
    expect(at.screeningRatio).toBe(0.35);
    expect(at.screeningMonthly).toBe(116_666);
    expect(at.screeningMaxLoan).toBe(28_220_000);

    // 無理のない目安は年収によらず25%
    expect(below.comfortableRatio).toBe(0.25);
    expect(at.comfortableRatio).toBe(0.25);
  });

  it("複数の入力を同時に渡すと、それぞれのブロックが入る", () => {
    const out = ok(
      simulateMortgage({ monthlyPayment: 100_000, loanAmount: 30_000_000, annualIncome: 5_000_000 }),
    );
    for (const scenario of out.scenarios) {
      expect(scenario.fromMonthlyPayment).toBeDefined();
      expect(scenario.fromLoanAmount).toBeDefined();
      expect(scenario.fromIncome).toBeDefined();
    }
  });
});

describe("返済期間と年齢（完済80歳）", () => {
  it("年齢が若ければ指定（既定35年）のまま", () => {
    expect(effectiveYears(35, 40)).toBe(35);
    expect(ok(simulateMortgage({ loanAmount: 30_000_000, age: 45 })).years).toBe(35);
  });

  it("55歳 → 80−55=25年に短縮され、計算もその期間で行われる", () => {
    const out = ok(simulateMortgage({ loanAmount: 30_000_000, age: 55 }));
    expect(out.years).toBe(25);
    // 3000万円・年1.2%・25年 → 115,798.50円 → 切り上げて115,799円
    expect(out.scenarios[0].fromLoanAmount!.monthlyPayment).toBe(115_799);
  });

  it("年数を指定していて、年齢の方が短ければ年齢が優先（20年指定・65歳 → 15年）", () => {
    expect(ok(simulateMortgage({ loanAmount: 30_000_000, years: 20, age: 65 })).years).toBe(15);
    // 年数の方が短ければ指定どおり
    expect(ok(simulateMortgage({ loanAmount: 30_000_000, years: 10, age: 55 })).years).toBe(10);
  });

  it("80歳以上は完済できないのでエラー（例外は投げない）", () => {
    for (const age of [80, 85]) {
      const result = simulateMortgage({ loanAmount: 30_000_000, age });
      expect(result).toEqual({
        error: { code: "AGE_LIMIT_EXCEEDED", message: expect.any(String) },
      });
    }
    expect(effectiveYears(35, 80)).toBeNull();
  });
});

describe("入力不足・不正はエラーで返す（例外を投げない）", () => {
  it("月々・借入額・年収のどれも無ければ MISSING_INPUT", () => {
    expect(simulateMortgage({})).toEqual({
      error: { code: "MISSING_INPUT", message: expect.any(String) },
    });
    expect(simulateMortgage({ years: 30, age: 40 })).toMatchObject({
      error: { code: "MISSING_INPUT" },
    });
  });

  it("0以下の金額は INVALID_INPUT", () => {
    expect(simulateMortgage({ annualIncome: 0 })).toMatchObject({ error: { code: "INVALID_INPUT" } });
    expect(simulateMortgage({ loanAmount: -1 })).toMatchObject({ error: { code: "INVALID_INPUT" } });
  });

  it("範囲外の金利・期間は専用のエラーコード", () => {
    expect(simulateMortgage({ loanAmount: 1, variableRate: 21 })).toMatchObject({
      error: { code: "INVALID_RATE" },
    });
    expect(simulateMortgage({ loanAmount: 1, fixedRate: -0.1 })).toMatchObject({
      error: { code: "INVALID_RATE" },
    });
    expect(simulateMortgage({ loanAmount: 30_000_000, years: 36 })).toMatchObject({
      error: { code: "INVALID_YEARS" },
    });
    expect(simulateMortgage({ loanAmount: 30_000_000, years: 0 })).toMatchObject({
      error: { code: "INVALID_YEARS" },
    });
  });
});
