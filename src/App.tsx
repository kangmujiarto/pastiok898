import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Copy, RotateCcw, X } from 'lucide-react';
import {
  calculateRow,
  FORMULA_OPTIONS,
  POSITION_KEYS,
  type DrawRow,
  type FormulaKey,
  type PositionKey,
} from './lib/formula';
import { FormulaReferencePanel } from './components/FormulaReferencePanel';

const EMPTY_ROWS: DrawRow[] = [
  { AS: '', COP: '', KEP: '', EKOR: '' },
  { AS: '', COP: '', KEP: '', EKOR: '' },
  { AS: '', COP: '', KEP: '', EKOR: '' },
  { AS: '', COP: '', KEP: '', EKOR: '' },
];

const ROW_HEADER_COLORS = [
  'bg-[#EAB308] text-slate-950',
  'bg-[#22C55E] text-slate-950',
  'bg-[#3B82F6] text-white',
  'bg-[#EC4899] text-white',
] as const;

const CELL_STYLES: Record<
  PositionKey,
  { header: string; input: string }
> = {
  AS: {
    header: 'bg-[#FEF08A] text-[#713F12]',
    input: 'bg-[#FEF08A] border-[#EAB308] text-[#713F12] focus:ring-[#EAB308]/40',
  },
  COP: {
    header: 'bg-[#86EFAC] text-[#14532D]',
    input: 'bg-[#86EFAC] border-[#22C55E] text-[#14532D] focus:ring-[#22C55E]/40',
  },
  KEP: {
    header: 'bg-[#93C5FD] text-[#1E3A8A]',
    input: 'bg-[#93C5FD] border-[#3B82F6] text-[#1E3A8A] focus:ring-[#3B82F6]/40',
  },
  EKOR: {
    header: 'bg-[#F9A8D4] text-[#831843]',
    input: 'bg-[#F9A8D4] border-[#EC4899] text-[#831843] focus:ring-[#EC4899]/40',
  },
};

export default function App() {
  const [k1, setK1] = useState<FormulaKey>('Ty');
  const [k2, setK2] = useState<FormulaKey>('Indx');
  const [k3, setK3] = useState<FormulaKey>('ML');
  const [patokan, setPatokan] = useState<PositionKey>('AS');
  const [rows, setRows] = useState<DrawRow[]>(() => EMPTY_ROWS.map((r) => ({ ...r })));
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isRefOpenMobile, setIsRefOpenMobile] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: 4 }, () => Array(4).fill(null))
  );
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const results = useMemo(
    () => rows.map((row) => calculateRow(row, k1, k2, k3, patokan)),
    [rows, k1, k2, k3, patokan]
  );

  const rekapText = useMemo(() => {
    const validCodes = results
      .filter((r) => !r.isEmpty && !r.isBroken)
      .map((r) => r.code);
    return validCodes.length > 0 ? validCodes.join(' | ') : '---';
  }, [results]);

  const hasAnyInput = useMemo(
    () => rows.some((r) => r.AS !== '' || r.COP !== '' || r.KEP !== '' || r.EKOR !== ''),
    [rows]
  );

  const focusCell = useCallback((rowIndex: number, colIndex: number) => {
    const target = inputRefs.current[rowIndex]?.[colIndex];
    if (target) {
      target.focus();
      target.select();
    }
  }, []);

  const handleDigitChange = (rowIndex: number, colIndex: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');

    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 4).split('');
      setRows((prev) =>
        prev.map((row, rIdx) => {
          if (rIdx !== rowIndex) return row;
          const updated = { ...row };
          chars.forEach((digit, offset) => {
            const targetCol = colIndex + offset;
            if (targetCol < 4) {
              updated[POSITION_KEYS[targetCol]] = digit;
            }
          });
          return updated;
        })
      );
      const nextCol = Math.min(colIndex + chars.length, 3);
      if (colIndex + chars.length >= 4 && rowIndex < 3) {
        focusCell(rowIndex + 1, 0);
      } else {
        focusCell(rowIndex, nextCol);
      }
      return;
    }

    const posKey = POSITION_KEYS[colIndex];
    setRows((prev) =>
      prev.map((row, idx) => (idx === rowIndex ? { ...row, [posKey]: digitsOnly } : row))
    );

    if (digitsOnly.length === 1) {
      if (colIndex < 3) {
        focusCell(rowIndex, colIndex + 1);
      } else if (rowIndex < 3) {
        focusCell(rowIndex + 1, 0);
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const posKey = POSITION_KEYS[colIndex];
    if (e.key === 'Backspace' && rows[rowIndex][posKey] === '') {
      e.preventDefault();
      if (colIndex > 0) {
        focusCell(rowIndex, colIndex - 1);
      } else if (rowIndex > 0) {
        focusCell(rowIndex - 1, 3);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (colIndex < 3) focusCell(rowIndex, colIndex + 1);
      else if (rowIndex < 3) focusCell(rowIndex + 1, 0);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (colIndex > 0) focusCell(rowIndex, colIndex - 1);
      else if (rowIndex > 0) focusCell(rowIndex - 1, 3);
    } else if (e.key === 'ArrowDown' && rowIndex < 3) {
      e.preventDefault();
      focusCell(rowIndex + 1, colIndex);
    } else if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      focusCell(rowIndex - 1, colIndex);
    }
  };

  const handleReset = () => {
    setRows(EMPTY_ROWS.map((r) => ({ ...r })));
    setActiveRowIndex(null);
    setCopiedText(null);
    focusCell(0, 0);
  };

  const handleCopy = async () => {
    const payload = `Rumus ${k1}-${k2}-${k3} = ${rekapText}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = payload;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopiedText(rekapText);
    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedText(null);
    }, 2400);
  };

  return (
    <div className="h-dvh lg:h-auto lg:min-h-dvh flex flex-col bg-[#F3F5FB] text-slate-900 overflow-hidden lg:overflow-visible">
      <header className="shrink-0 bg-white border-b border-slate-200/80 px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-4">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1a2fa0] whitespace-nowrap shrink-0">
            JalakanTech
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsRefOpenMobile(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1a2fa0]" aria-hidden="true" />
              <span>Tabel</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={!hasAnyInput}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-5xl w-full mx-auto p-2 sm:p-6 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-6 lg:items-start">
        <section
          aria-label="Kalkulator Rumus 4 Keluaran"
          className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-4 h-full lg:h-auto"
        >
          {/* Formula Chain Selectors */}
          <div className="shrink-0 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs p-2 sm:p-4 grid grid-cols-4 gap-1.5 sm:gap-3">
            <div className="flex flex-col gap-0.5 sm:gap-1">
              <label
                htmlFor="select-k1"
                className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-wide"
              >
                KE 1
              </label>
              <select
                id="select-k1"
                value={k1}
                onChange={(e) => setK1(e.target.value as FormulaKey)}
                className="w-full h-9 sm:h-11 px-1.5 sm:px-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a2fa0]/25 focus:border-[#1a2fa0] cursor-pointer"
              >
                {FORMULA_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-0.5 sm:gap-1">
              <label
                htmlFor="select-k2"
                className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-wide"
              >
                KE 2
              </label>
              <select
                id="select-k2"
                value={k2}
                onChange={(e) => setK2(e.target.value as FormulaKey)}
                className="w-full h-9 sm:h-11 px-1.5 sm:px-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a2fa0]/25 focus:border-[#1a2fa0] cursor-pointer"
              >
                {FORMULA_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-0.5 sm:gap-1">
              <label
                htmlFor="select-k3"
                className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-wide"
              >
                KE 3
              </label>
              <select
                id="select-k3"
                value={k3}
                onChange={(e) => setK3(e.target.value as FormulaKey)}
                className="w-full h-9 sm:h-11 px-1.5 sm:px-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a2fa0]/25 focus:border-[#1a2fa0] cursor-pointer"
              >
                {FORMULA_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-0.5 sm:gap-1">
              <label
                htmlFor="select-patokan"
                className="text-[10px] sm:text-xs font-bold text-[#1a2fa0] tracking-wide"
              >
                PATOKAN
              </label>
              <select
                id="select-patokan"
                value={patokan}
                onChange={(e) => setPatokan(e.target.value as PositionKey)}
                className="w-full h-9 sm:h-11 px-1.5 sm:px-3 rounded-lg border border-[#1a2fa0]/40 bg-[#eef2ff] font-mono text-xs sm:text-sm font-bold text-[#1a2fa0] focus:outline-none focus:ring-2 focus:ring-[#1a2fa0]/30 focus:border-[#1a2fa0] cursor-pointer"
              >
                {POSITION_KEYS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main 4-Row Calculator Matrix */}
          <div className="flex-1 min-h-0 bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs p-2 sm:p-4 flex flex-col justify-between gap-1.5 sm:gap-3">
            {/* Column Headers */}
            <div className="shrink-0 grid grid-cols-[1fr_1fr_1fr_1fr_76px] sm:grid-cols-[1fr_1fr_1fr_1fr_112px] gap-1.5 sm:gap-2.5 text-center text-[11px] sm:text-xs font-bold">
              {POSITION_KEYS.map((pos) => {
                const isTarget = patokan === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPatokan(pos)}
                    title={`Jadikan ${pos} sebagai Patokan`}
                    className={`rounded-md sm:rounded-lg py-1 sm:py-1.5 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      CELL_STYLES[pos].header
                    } ${isTarget ? 'ring-2 ring-[#1a2fa0] ring-offset-1' : 'opacity-90 hover:opacity-100'}`}
                  >
                    <span>{pos}</span>
                  </button>
                );
              })}
              <div className="rounded-md sm:rounded-lg py-1 sm:py-1.5 bg-[#1a2fa0] text-white flex items-center justify-center">
                HASIL
              </div>
            </div>

            {/* 4 Keluaran Rows */}
            <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5 sm:gap-3">
              {rows.map((row, rowIndex) => {
                const calc = results[rowIndex];
                return (
                  <div
                    key={rowIndex}
                    className="flex-1 min-h-0 flex flex-col justify-center gap-1"
                  >
                    <div
                      className={`shrink-0 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md flex items-center justify-between ${ROW_HEADER_COLORS[rowIndex]}`}
                    >
                      <span>KELUARAN {rowIndex + 1}</span>
                      {!calc.isEmpty && (
                        <span className="font-mono tabular-nums opacity-90 text-[10px] sm:text-[11px]">
                          {calc.trace}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-h-[42px] sm:min-h-[54px] grid grid-cols-[1fr_1fr_1fr_1fr_76px] sm:grid-cols-[1fr_1fr_1fr_1fr_112px] gap-1.5 sm:gap-2.5 items-stretch">
                      {POSITION_KEYS.map((pos, colIndex) => {
                        const isTarget = patokan === pos;
                        return (
                          <input
                            key={pos}
                            ref={(el) => {
                              inputRefs.current[rowIndex][colIndex] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            aria-label={`Keluaran ${rowIndex + 1} ${pos}`}
                            placeholder="·"
                            value={row[pos]}
                            onFocus={(e) => {
                              setActiveRowIndex(rowIndex);
                              e.target.select();
                            }}
                            onChange={(e) =>
                              handleDigitChange(rowIndex, colIndex, e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            className={`w-full h-full min-h-[40px] sm:min-h-[52px] rounded-lg border-2 text-center font-mono tabular-nums text-lg sm:text-2xl font-bold placeholder:text-slate-600/30 focus:outline-none focus:ring-2 transition-shadow ${
                              CELL_STYLES[pos].input
                            } ${isTarget ? 'shadow-xs ring-1 ring-[#1a2fa0]/40' : ''}`}
                          />
                        );
                      })}

                      <div
                        className={`rounded-lg flex flex-col items-center justify-center px-1 text-center transition-colors ${
                          calc.isBroken
                            ? 'bg-red-700 text-white'
                            : calc.isEmpty
                              ? 'bg-[#1a2fa0]/90 text-white'
                              : 'bg-[#1a2fa0] text-white shadow-xs'
                        }`}
                      >
                        <b className="font-mono tabular-nums text-sm sm:text-lg tracking-wider leading-tight">
                          {calc.code}
                        </b>
                        <span className="text-[9px] sm:text-[10px] opacity-80 leading-tight truncate max-w-full">
                          {calc.isEmpty ? 'isi dulu' : calc.trace}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rekap & Salin Bar */}
            <div className="shrink-0 bg-[#FFFBEB] border border-dashed border-[#F59E0B] rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold text-amber-900/80 shrink-0">
                  REKAP
                </span>
                <b className="font-mono tabular-nums text-sm sm:text-base font-bold text-[#1a2fa0] truncate">
                  {rekapText}
                </b>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[38px] sm:min-h-[42px] px-3.5 sm:px-5 rounded-lg font-bold text-xs sm:text-sm text-white transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer ${
                  copiedText !== null
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-[#16a34a] hover:bg-[#15803d]'
                }`}
              >
                {copiedText !== null ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>TERSALIN</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>SALIN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Desktop Reference Panel */}
        <div className="hidden lg:block">
          <FormulaReferencePanel
            k1={k1}
            k2={k2}
            k3={k3}
            patokan={patokan}
            results={results}
            activeRowIndex={activeRowIndex}
          />
        </div>
      </main>

      {/* Non-blocking copy confirmation toast */}
      {copiedText !== null && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>
            Disalin: <span className="font-mono font-bold">{copiedText}</span>
          </span>
        </div>
      )}

      {/* Mobile Reference Sheet Drawer */}
      {isRefOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-end"
          onClick={() => setIsRefOpenMobile(false)}
        >
          <div
            className="w-full max-h-[82dvh] overflow-y-auto bg-white rounded-t-3xl p-4 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">
                Referensi Tabel & Alur
              </span>
              <button
                type="button"
                onClick={() => setIsRefOpenMobile(false)}
                aria-label="Tutup tabel referensi"
                className="min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FormulaReferencePanel
              k1={k1}
              k2={k2}
              k3={k3}
              patokan={patokan}
              results={results}
              activeRowIndex={activeRowIndex}
            />
          </div>
        </div>
      )}
    </div>
  );
}
