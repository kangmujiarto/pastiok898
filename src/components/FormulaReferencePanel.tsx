import { FORMULA_OPTIONS, type FormulaKey, type PositionKey, type RowCalculation } from '../lib/formula';

interface FormulaReferencePanelProps {
  k1: FormulaKey;
  k2: FormulaKey;
  k3: FormulaKey;
  patokan: PositionKey;
  results: RowCalculation[];
  activeRowIndex: number | null;
}

export function FormulaReferencePanel({
  k1,
  k2,
  k3,
  patokan,
  results,
  activeRowIndex,
}: FormulaReferencePanelProps) {
  const activeFormulaSlots = (key: FormulaKey): string[] => {
    const slots: string[] = [];
    if (k1 === key) slots.push('KE 1');
    if (k2 === key) slots.push('KE 2');
    if (k3 === key) slots.push('KE 3');
    return slots;
  };

  const focusedResult =
    activeRowIndex !== null
      ? results[activeRowIndex]
      : results.find((r) => !r.isEmpty && !r.isBroken) ?? null;

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-5">
      <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Tabel Referensi Rumus</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rantai aktif: {k1} → {k2} → {k3} · Patokan {patokan}
          </p>
        </div>
      </div>

      {focusedResult && !focusedResult.isEmpty && (
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70">
          <div className="text-xs font-medium text-slate-500 mb-1.5">
            Alur Perhitungan {activeRowIndex !== null ? `Keluaran ${activeRowIndex + 1}` : 'Terakhir'}
          </div>
          <div className="flex items-center justify-between gap-2 font-mono tabular-nums text-sm">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-sans text-slate-500">{patokan}</span>
              <span className="font-bold text-slate-900 text-base">{focusedResult.steps.start}</span>
            </div>
            <span className="text-slate-400">→</span>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-sans text-[#1a2fa0] font-medium">{k1}</span>
              <span className="font-bold text-[#1a2fa0] text-base">
                {focusedResult.steps.a ?? '×'}
              </span>
            </div>
            <span className="text-slate-400">→</span>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-sans text-[#1a2fa0] font-medium">{k2}</span>
              <span className="font-bold text-[#1a2fa0] text-base">
                {focusedResult.steps.b ?? '×'}
              </span>
            </div>
            <span className="text-slate-400">→</span>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-sans text-[#1a2fa0] font-medium">{k3}</span>
              <span className="font-bold text-[#1a2fa0] text-base">
                {focusedResult.steps.c ?? '×'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {FORMULA_OPTIONS.map((formula) => {
          const slots = activeFormulaSlots(formula.key);
          const isActive = slots.length > 0;

          return (
            <div
              key={formula.key}
              className={`py-3 first:pt-0 last:pb-0 transition-colors ${
                isActive ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-mono text-sm font-bold ${
                      isActive ? 'text-[#1a2fa0]' : 'text-slate-800'
                    }`}
                  >
                    {formula.label}
                  </span>
                  <span className="text-xs text-slate-500">{formula.fullName}</span>
                </div>
                {isActive && (
                  <span className="text-xs font-semibold text-[#1a2fa0] whitespace-nowrap">
                    {slots.join(' · ')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1.5 font-mono tabular-nums text-xs">
                {formula.pairs.map(([left, right]) => (
                  <div
                    key={`${formula.key}-${left}-${right}`}
                    className={`py-1 px-1.5 rounded-md text-center border ${
                      isActive
                        ? 'bg-[#eef2ff] border-[#c7d2fe] text-[#1a2fa0] font-semibold'
                        : 'bg-slate-50 border-slate-200/70 text-slate-700'
                    }`}
                  >
                    {left}↔{right}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
