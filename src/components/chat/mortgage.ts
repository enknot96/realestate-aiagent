// simulateMortgage ツールの出力の型と型ガード（表示用。計算はツール側）
type Money = { monthlyPayment: number; loanAmount: number; totalPayment: number; totalInterest: number };

export type MortgageScenario = {
  kind: "variable" | "fixed";
  rate: number;
  fromMonthlyPayment?: Money;
  fromLoanAmount?: Money;
  fromIncome?: {
    annualIncome: number;
    screeningRatio: number;
    screeningMaxLoan: number;
    screeningMonthly: number;
    comfortableRatio: number;
    comfortableMaxLoan: number;
    comfortableMonthly: number;
  };
};

export type SimulateMortgageOutput = {
  years: number;
  rateAsOf: string;
  sources: { label: string; url: string }[];
  scenarios: MortgageScenario[];
  note: string;
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const hasNums = (v: unknown, keys: string[]): boolean => isObj(v) && keys.every((k) => isNum(v[k]));

const MONEY_KEYS = ["monthlyPayment", "loanAmount", "totalPayment", "totalInterest"];
const INCOME_KEYS = [
  "annualIncome",
  "screeningRatio",
  "screeningMaxLoan",
  "screeningMonthly",
  "comfortableRatio",
  "comfortableMaxLoan",
  "comfortableMonthly",
];

function isScenario(s: unknown): s is MortgageScenario {
  if (!isObj(s) || (s.kind !== "variable" && s.kind !== "fixed") || !isNum(s.rate)) return false;
  for (const key of ["fromMonthlyPayment", "fromLoanAmount"]) {
    if (s[key] !== undefined && !hasNums(s[key], MONEY_KEYS)) return false;
  }
  return s.fromIncome === undefined || hasNums(s.fromIncome, INCOME_KEYS);
}

// 不正な形なら false（カードは何も描画しない）
export function isSimulateMortgageOutput(v: unknown): v is SimulateMortgageOutput {
  if (!isObj(v) || !isNum(v.years) || typeof v.note !== "string") return false;
  if (typeof v.rateAsOf !== "string" || !Array.isArray(v.sources) || !Array.isArray(v.scenarios)) {
    return false;
  }
  const sourcesOk = v.sources.every(
    (s) => isObj(s) && typeof s.label === "string" && typeof s.url === "string",
  );
  return sourcesOk && v.scenarios.length > 0 && v.scenarios.every(isScenario);
}

export type MortgageOrigin = "income" | "monthlyPayment" | "loanAmount";

// 計算の起点（シナリオに入っている結果から判定する）
export function mortgageOrigin(scenarios: MortgageScenario[]): MortgageOrigin | null {
  const s = scenarios[0];
  if (s.fromIncome) return "income";
  if (s.fromMonthlyPayment) return "monthlyPayment";
  if (s.fromLoanAmount) return "loanAmount";
  return null;
}

// 「この予算で物件を探す」の上限価格（年収起点は無理のない目安、それ以外は借入額。いずれも変動）
export function mortgageBudget(scenarios: MortgageScenario[]): number | null {
  const s = scenarios.find((x) => x.kind === "variable") ?? scenarios[0];
  const amount = s.fromIncome
    ? s.fromIncome.comfortableMaxLoan
    : (s.fromMonthlyPayment ?? s.fromLoanAmount)?.loanAmount;
  return amount !== undefined && amount > 0 ? Math.floor(amount) : null;
}
