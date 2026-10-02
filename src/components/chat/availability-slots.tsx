"use client";

import { jstDate, jstTime } from "./format";
import type { AvailabilityOutput } from "./types";

// 空き枠をクリック可能なチップとして表示する
export function AvailabilitySlots({
  output,
  onPickSlot,
}: {
  output: AvailabilityOutput;
  onPickSlot: (label: string) => void;
}) {
  const days = (output.days ?? []).filter((day) => day.availableStartAts.length > 0);
  if (days.length === 0) {
    return <p className="mt-1 text-xs text-gray-500">この期間に空き枠はありません</p>;
  }
  return (
    <div className="mt-3 space-y-5">
      {days.map((day) => (
        <div key={day.date}>
          <p className="mb-2 text-xs font-bold text-gray-600">
            {jstDate.format(new Date(`${day.date}T00:00:00+09:00`))}
          </p>
          <div className="flex flex-wrap gap-2">
            {day.availableStartAts.map((startAt) => {
              const time = jstTime.format(new Date(startAt));
              return (
                <button
                  key={startAt}
                  type="button"
                  className="cursor-pointer rounded-full border border-brand-teal/40 bg-white px-3.5 py-2 text-xs text-brand-teal hover:bg-brand-teal/10"
                  onClick={() =>
                    onPickSlot(`${jstDate.format(new Date(startAt))} ${time} で内見を希望します`)
                  }
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
