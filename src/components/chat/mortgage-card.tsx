"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { buildSearchParams, formatPrice } from "@/lib/property";
import { isSimulateMortgageOutput, mortgageBudget, mortgageOrigin } from "./mortgage";
import type { MortgageScenario, SimulateMortgageOutput } from "./mortgage";

const KIND_LABEL = { variable: "変動金利", fixed: "固定金利" } as const;

// 「月々 8.5万円」（formatPrice は「/月」を付けない種別で使う）
const monthly = (n: number) => `月々 ${formatPrice(n)}`;

function originLabel(output: SimulateMortgageOutput): string {
  const s = output.scenarios[0];
  switch (mortgageOrigin(output.scenarios)) {
    case "income":
      return `年収${formatPrice(s.fromIncome!.annualIncome)}から`;
    case "monthlyPayment":
      return `月々${formatPrice(s.fromMonthlyPayment!.monthlyPayment)}から`;
    case "loanAmount":
      return `借入${formatPrice(s.fromLoanAmount!.loanAmount)}の場合`;
    default:
      return "";
  }
}

// 総返済額・利息（控えめ表示）
function Totals({ totalPayment, totalInterest }: { totalPayment: number; totalInterest: number }) {
  return (
    <p className="mt-2 text-xs text-gray-500">
      総返済額 {formatPrice(totalPayment)}（うち利息 {formatPrice(totalInterest)}）
    </p>
  );
}

function ScenarioColumn({ scenario, maxLoan }: { scenario: MortgageScenario; maxLoan: number }) {
  const { fromIncome, fromMonthlyPayment, fromLoanAmount } = scenario;
  const money = fromMonthlyPayment ?? fromLoanAmount;
  const bar = (v: number) => `${Math.max(4, Math.min(100, (v / maxLoan) * 100))}%`;

  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-bold text-white ${
            scenario.kind === "variable" ? "bg-brand-teal" : "bg-brand-navy"
          }`}
        >
          {KIND_LABEL[scenario.kind]}
        </span>
        <span className="text-xs text-gray-500">年利 {scenario.rate}%</span>
      </div>

      {fromIncome && (
        <div className="mt-2">
          <p className="text-xs font-bold text-brand-teal">
            無理のない目安（返済負担率{Math.round(fromIncome.comfortableRatio * 100)}%）
          </p>
          <p className="text-xl leading-tight font-bold text-brand-navy">
            {formatPrice(fromIncome.comfortableMaxLoan)}
          </p>
          <p className="text-xs text-gray-600">{monthly(fromIncome.comfortableMonthly)}</p>
          {fromIncome.comfortableCapped && (
            <p className="mt-1 text-[11px] leading-snug text-amber-700">
              金利の上昇に備え、審査上限を超えない額にしています
            </p>
          )}
          <div className="mt-2 h-1.5 rounded-full bg-gray-100" aria-hidden>
            <div
              className="h-full rounded-full bg-brand-teal"
              style={{ width: bar(fromIncome.comfortableMaxLoan) }}
            />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            審査上限の目安（返済負担率{Math.round(fromIncome.screeningRatio * 100)}%・審査金利
            {fromIncome.screeningRate}%で試算）
          </p>
          <p className="text-sm font-semibold text-gray-600">
            {formatPrice(fromIncome.screeningMaxLoan)}
            <span className="ml-1 text-xs font-normal">（{monthly(fromIncome.screeningMonthly)}）</span>
          </p>
          <div className="mt-1 h-1.5 rounded-full bg-gray-100" aria-hidden>
            <div
              className="h-full rounded-full bg-gray-400"
              style={{ width: bar(fromIncome.screeningMaxLoan) }}
            />
          </div>
        </div>
      )}

      {money && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">借入額の目安</p>
          <p className="text-xl leading-tight font-bold text-brand-navy">
            {formatPrice(money.loanAmount)}
          </p>
          <p className="text-xs text-gray-600">{monthly(money.monthlyPayment)}</p>
          <Totals totalPayment={money.totalPayment} totalInterest={money.totalInterest} />
        </div>
      )}
    </div>
  );
}

export function MortgageCard({ output }: { output: unknown }) {
  if (!isSimulateMortgageOutput(output)) return null;

  const origin = originLabel(output);
  const budget = mortgageBudget(output.scenarios);
  const maxLoan = Math.max(
    1,
    ...output.scenarios.flatMap((s) => [s.fromIncome?.comfortableMaxLoan ?? 0, s.fromIncome?.screeningMaxLoan ?? 0]),
  );
  const href = budget
    ? `/properties?${buildSearchParams({ type: "sale", maxPrice: budget }).toString()}`
    : null;

  return (
    <section className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
      <h3 className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold text-brand-navy">
        資金計画の目安
        {origin && <span className="text-xs font-normal text-gray-600">{origin}</span>}
        <span className="text-xs font-normal text-gray-500">返済期間{output.years}年</span>
      </h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {output.scenarios.map((s) => (
          <ScenarioColumn key={s.kind} scenario={s} maxLoan={maxLoan} />
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        {output.note}（金利は{output.rateAsOf}時点）
      </p>
      {output.sources.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          出典:{" "}
          {output.sources.map((src, i) => (
            <span key={src.url}>
              {i > 0 && "、"}
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-teal"
              >
                {src.label}
              </a>
            </span>
          ))}
        </p>
      )}

      {href && (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-teal px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          この予算で物件を探す
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      )}
    </section>
  );
}
