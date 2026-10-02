import { describe, expect, it } from "vitest";
import {
  isSimulateMortgageOutput,
  mortgageBudget,
  mortgageOrigin,
} from "@/components/chat/mortgage";

const money = { monthlyPayment: 80_000, loanAmount: 28_000_000, totalPayment: 33_600_000, totalInterest: 5_600_000 };
const income = {
  annualIncome: 5_000_000,
  screeningRatio: 0.35,
  screeningRate: 3.5,
  screeningMaxLoan: 40_000_000,
  screeningMonthly: 145_000,
  comfortableRatio: 0.25,
  comfortableMaxLoan: 30_000_000,
  comfortableMonthly: 104_000,
  comfortableCapped: false,
};
const base = {
  years: 35,
  rateAsOf: "2026年10月",
  sources: [{ label: "住宅金融支援機構", url: "https://www.jhf.go.jp/" }],
  note: "目安です",
};
const fromIncome = {
  ...base,
  scenarios: [
    { kind: "variable", rate: 0.9, fromIncome: income },
    { kind: "fixed", rate: 1.9, fromIncome: { ...income, comfortableMaxLoan: 25_000_000 } },
  ],
};
const fromMonthly = {
  ...base,
  scenarios: [
    { kind: "variable", rate: 0.9, fromMonthlyPayment: money },
    { kind: "fixed", rate: 1.9, fromMonthlyPayment: money },
  ],
};

describe("isSimulateMortgageOutput（型ガード）", () => {
  it("正しい形を受け付ける", () => {
    expect(isSimulateMortgageOutput(fromIncome)).toBe(true);
    expect(isSimulateMortgageOutput(fromMonthly)).toBe(true);
  });

  it("不正な形を弾く", () => {
    expect(isSimulateMortgageOutput(null)).toBe(false);
    expect(isSimulateMortgageOutput({})).toBe(false);
    expect(isSimulateMortgageOutput({ error: { code: "x", message: "y" } })).toBe(false);
    expect(isSimulateMortgageOutput({ ...base, scenarios: [] })).toBe(false);
    expect(isSimulateMortgageOutput({ ...fromIncome, years: "35" })).toBe(false);
    expect(isSimulateMortgageOutput({ ...fromIncome, sources: [{ label: 1 }] })).toBe(false);
    expect(
      isSimulateMortgageOutput({ ...base, scenarios: [{ kind: "other", rate: 1 }] }),
    ).toBe(false);
    expect(
      isSimulateMortgageOutput({
        ...base,
        scenarios: [{ kind: "variable", rate: 1, fromIncome: { annualIncome: 1 } }],
      }),
    ).toBe(false);
  });
});

describe("mortgageOrigin / mortgageBudget", () => {
  it("年収起点は無理のない目安（変動）を上限にする", () => {
    expect(mortgageOrigin(fromIncome.scenarios as never)).toBe("income");
    expect(mortgageBudget(fromIncome.scenarios as never)).toBe(30_000_000);
  });

  it("月額起点は借入額（変動）を上限にする", () => {
    expect(mortgageOrigin(fromMonthly.scenarios as never)).toBe("monthlyPayment");
    expect(mortgageBudget(fromMonthly.scenarios as never)).toBe(28_000_000);
  });
});
