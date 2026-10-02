// 資金計画（住宅ローン）の計算。AIには計算させず、このファイルの純粋関数だけが数字を出す。
// 返済方式は元利均等・ボーナス払いなし。頭金・諸費用・審査可否は扱わない

// ── 定数（参考値の時点: 2026年10月） ──
export const RATE_AS_OF = "2026年10月" as const;

// 変動: 三菱UFJ銀行 2026年10月の変動金利 年1.195%
// https://www.bk.mufg.jp/kariru/jutaku/yuuguu/index.html
export const DEFAULT_VARIABLE_RATE = 1.2;
// 固定: 住宅金融支援機構 フラット35 2026年10月の最頻金利 年3.830%（借入期間21〜35年・融資率9割以下）
// https://www.simulation.jhf.go.jp/flat35/kinri/index.php/rates/top
export const DEFAULT_FIXED_RATE = 3.8;

// 審査上限の目安の返済負担率（フラット35の基準: 年収400万円未満30%、400万円以上35%）
export const SCREENING_INCOME_THRESHOLD = 4_000_000;
export const SCREENING_RATIO_LOW_INCOME = 0.3;
export const SCREENING_RATIO_HIGH_INCOME = 0.35;
// 無理のない目安の返済負担率。作者（元ハウスメーカー営業）の経験に基づく目安で、公的な基準ではない
export const COMFORTABLE_RATIO = 0.25;
// 審査上限の目安に使う審査金利（%）。銀行は適用金利より高い審査金利で返済額を見積もるのが一般的だが、
// 値は各行非公表で一次情報が無いため、作者の営業経験に基づく想定値（2026年10月時点）。
// 適用金利の方が高い場合は適用金利を使う。将来は管理画面から変更できるようにする想定
export const SCREENING_RATE = 3.5;

export const DEFAULT_YEARS = 35;
export const MAX_YEARS = 35;
// 完済年齢の上限
export const MAX_AGE_AT_PAYOFF = 80;

export const MORTGAGE_SOURCES = [
  {
    label: "三菱UFJ銀行 住宅ローン 2026年10月の変動金利",
    url: "https://www.bk.mufg.jp/kariru/jutaku/yuuguu/index.html",
  },
  {
    label: "住宅金融支援機構 フラット35 2026年10月の金利",
    url: "https://www.simulation.jhf.go.jp/flat35/kinri/index.php/rates/top",
  },
  {
    label: "住宅金融支援機構 フラット35（返済負担率の基準）",
    url: "https://www.flat35.com/loan/lineup/flat35/conditions/index.html",
  },
];

export const MORTGAGE_NOTE =
  "金利は2026年10月時点の参考値で、審査結果ではありません。頭金・諸費用は含みません";

// ── 型（N2のカード表示がこの形を前提にする。変更しないこと） ──
export type SimulateMortgageOutput = {
  years: number; // 実際に使った返済期間（年齢で短縮された場合はその値）
  rateAsOf: typeof RATE_AS_OF;
  sources: { label: string; url: string }[]; // 金利と返済負担率の出典
  scenarios: {
    kind: "variable" | "fixed";
    rate: number; // 年利（%）
    fromMonthlyPayment?: {
      monthlyPayment: number;
      loanAmount: number;
      totalPayment: number;
      totalInterest: number;
    };
    fromLoanAmount?: {
      loanAmount: number;
      monthlyPayment: number;
      totalPayment: number;
      totalInterest: number;
    };
    fromIncome?: {
      annualIncome: number;
      screeningRatio: number; // 0.3 or 0.35
      screeningRate: number; // 審査上限の試算に使った審査金利（%）。max(適用金利, SCREENING_RATE)
      screeningMaxLoan: number;
      screeningMonthly: number;
      comfortableRatio: number; // 0.25
      comfortableMaxLoan: number; // 審査上限を超えない
      comfortableMonthly: number; // 適用金利での月々の返済額
      comfortableCapped: boolean; // 審査上限で頭打ちにしたか
    };
  }[]; // 常に [変動, 固定] の2要素
  note: string;
};

export type MortgageError = { error: { code: string; message: string } };

export type SimulateMortgageInput = {
  monthlyPayment?: number;
  loanAmount?: number;
  annualIncome?: number;
  years?: number;
  age?: number;
  variableRate?: number;
  fixedRate?: number;
};

// ── 基本の計算 ──

const MAN_YEN = 10_000;

// 浮動小数点の誤差で「ちょうど整数」の値が1円繰り上がらないよう、わずかに許容して切り上げる
const EPSILON = 1e-6;

// 元利均等の月々の返済額。円未満切り上げ。r=0（無利息）のときは P / n
export function calcMonthlyPayment(principal: number, annualRatePercent: number, years: number) {
  const n = years * 12;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return Math.ceil(principal / n - EPSILON);
  const factor = Math.pow(1 + r, n);
  return Math.ceil((principal * r * factor) / (factor - 1) - EPSILON);
}

// 月々の返済額から借りられる額。1万円未満切り捨て
export function calcLoanAmount(monthlyPayment: number, annualRatePercent: number, years: number) {
  const n = years * 12;
  const r = annualRatePercent / 100 / 12;
  const principal =
    r === 0
      ? monthlyPayment * n
      : (monthlyPayment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
  return Math.floor(principal / MAN_YEN + EPSILON) * MAN_YEN;
}

// 年収400万円未満は30%、400万円以上は35%
export function screeningRatioFor(annualIncome: number) {
  return annualIncome < SCREENING_INCOME_THRESHOLD
    ? SCREENING_RATIO_LOW_INCOME
    : SCREENING_RATIO_HIGH_INCOME;
}

// 年齢が与えられたら完済80歳に収まるよう短縮する。0年以下になる場合は null
export function effectiveYears(years: number, age?: number) {
  if (age === undefined) return years;
  const limited = Math.min(years, MAX_AGE_AT_PAYOFF - age);
  return limited >= 1 ? limited : null;
}

// ── 1シナリオ（変動 or 固定）の計算 ──

function buildScenario(
  kind: "variable" | "fixed",
  rate: number,
  years: number,
  input: SimulateMortgageInput,
): SimulateMortgageOutput["scenarios"][number] {
  const n = years * 12;
  const scenario: SimulateMortgageOutput["scenarios"][number] = { kind, rate };

  if (input.monthlyPayment !== undefined) {
    const monthlyPayment = input.monthlyPayment;
    const loanAmount = calcLoanAmount(monthlyPayment, rate, years);
    const totalPayment = monthlyPayment * n;
    scenario.fromMonthlyPayment = {
      monthlyPayment,
      loanAmount,
      totalPayment,
      totalInterest: totalPayment - loanAmount,
    };
  }

  if (input.loanAmount !== undefined) {
    const loanAmount = input.loanAmount;
    const monthlyPayment = calcMonthlyPayment(loanAmount, rate, years);
    const totalPayment = monthlyPayment * n;
    scenario.fromLoanAmount = {
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest: totalPayment - loanAmount,
    };
  }

  if (input.annualIncome !== undefined) {
    const annualIncome = input.annualIncome;
    const screeningRatio = screeningRatioFor(annualIncome);
    // 年間返済額の上限 = 年収 × 比率 → ÷12 で月額（円未満切り捨て。上限を超えないように）
    const screeningMonthly = Math.floor((annualIncome * screeningRatio) / 12);
    // 審査上限は、適用金利ではなく（より高い）審査金利で見積もる
    const screeningRate = Math.max(rate, SCREENING_RATE);
    const screeningMaxLoan = calcLoanAmount(screeningMonthly, screeningRate, years);

    // 無理のない目安は適用金利で計算する。低金利の変動では審査上限を上回ることがあるため、
    // 審査上限で頭打ちにする（「無理のない目安 > 審査上限」という矛盾した表示を避ける）
    const comfortableRaw = calcLoanAmount(
      Math.floor((annualIncome * COMFORTABLE_RATIO) / 12),
      rate,
      years,
    );
    const comfortableCapped = comfortableRaw > screeningMaxLoan;
    const comfortableMaxLoan = comfortableCapped ? screeningMaxLoan : comfortableRaw;

    scenario.fromIncome = {
      annualIncome,
      screeningRatio,
      screeningRate,
      screeningMaxLoan,
      screeningMonthly,
      comfortableRatio: COMFORTABLE_RATIO,
      comfortableMaxLoan,
      // 頭打ちにした場合も、実際に借りる額の適用金利での返済額を示す
      comfortableMonthly: calcMonthlyPayment(comfortableMaxLoan, rate, years),
      comfortableCapped,
    };
  }

  return scenario;
}

// ── 入口（ツールから呼ぶ。例外は投げず、エラーは { error } で返す） ──

function invalid(code: string, message: string): MortgageError {
  return { error: { code, message } };
}

function isPositive(value: number | undefined) {
  return value === undefined || (Number.isFinite(value) && value > 0);
}

function isValidRate(value: number | undefined) {
  return value === undefined || (Number.isFinite(value) && value >= 0 && value <= 20);
}

export function simulateMortgage(input: SimulateMortgageInput): SimulateMortgageOutput | MortgageError {
  if (
    input.monthlyPayment === undefined &&
    input.loanAmount === undefined &&
    input.annualIncome === undefined
  ) {
    return invalid(
      "MISSING_INPUT",
      "月々の返済額・借入額・年収のいずれか1つ以上が必要です。ユーザーに確認してください",
    );
  }
  if (
    !isPositive(input.monthlyPayment) ||
    !isPositive(input.loanAmount) ||
    !isPositive(input.annualIncome)
  ) {
    return invalid("INVALID_INPUT", "金額は0より大きい数値（円）で指定してください");
  }
  if (!isValidRate(input.variableRate) || !isValidRate(input.fixedRate)) {
    return invalid("INVALID_RATE", "金利は0〜20（%）の範囲で指定してください");
  }

  const requestedYears = input.years ?? DEFAULT_YEARS;
  if (!Number.isInteger(requestedYears) || requestedYears < 1 || requestedYears > MAX_YEARS) {
    return invalid("INVALID_YEARS", `返済期間は1〜${MAX_YEARS}年の整数で指定してください`);
  }
  if (input.age !== undefined && (!Number.isInteger(input.age) || input.age < 0)) {
    return invalid("INVALID_AGE", "年齢は0以上の整数で指定してください");
  }

  const years = effectiveYears(requestedYears, input.age);
  if (years === null) {
    return invalid(
      "AGE_LIMIT_EXCEEDED",
      `完済${MAX_AGE_AT_PAYOFF}歳までに返済期間を確保できないため、シミュレーションできません`,
    );
  }

  return {
    years,
    rateAsOf: RATE_AS_OF,
    sources: MORTGAGE_SOURCES,
    scenarios: [
      buildScenario("variable", input.variableRate ?? DEFAULT_VARIABLE_RATE, years, input),
      buildScenario("fixed", input.fixedRate ?? DEFAULT_FIXED_RATE, years, input),
    ],
    note: MORTGAGE_NOTE,
  };
}
