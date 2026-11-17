export type FormulaKey = 'Ty' | 'ML' | 'Mb' | 'Indx' | 'MO' | 'M9';
export type PositionKey = 'AS' | 'COP' | 'KEP' | 'EKOR';

export interface FormulaMeta {
  key: FormulaKey;
  label: string;
  fullName: string;
  pairs: readonly [number, number][];
}

export const FORMULA_TABLES: Record<FormulaKey, readonly [number, number][]> = {
  ML: [
    [0, 1],
    [2, 5],
    [3, 8],
    [4, 7],
    [6, 9],
  ],
  Mb: [
    [0, 8],
    [2, 6],
    [3, 9],
    [4, 5],
    [7, 1],
  ],
  Indx: [
    [0, 5],
    [2, 7],
    [3, 8],
    [4, 9],
    [1, 6],
  ],
  Ty: [
    [0, 7],
    [2, 9],
    [3, 6],
    [4, 1],
    [5, 8],
  ],
  MO: [
    [0, 6],
    [1, 5],
    [2, 8],
    [3, 7],
    [4, 9],
  ],
  M9: [
    [0, 9],
    [1, 8],
    [2, 7],
    [3, 6],
    [4, 5],
  ],
};

export const FORMULA_OPTIONS: FormulaMeta[] = [
  { key: 'Ty', label: 'Ty', fullName: 'Teysen', pairs: FORMULA_TABLES.Ty },
  { key: 'ML', label: 'ML', fullName: 'Mistik Lama', pairs: FORMULA_TABLES.ML },
  { key: 'Mb', label: 'Mb', fullName: 'Mistik Baru', pairs: FORMULA_TABLES.Mb },
  { key: 'Indx', label: 'Indx', fullName: 'Index', pairs: FORMULA_TABLES.Indx },
  { key: 'MO', label: 'MO', fullName: 'Mistik O', pairs: FORMULA_TABLES.MO },
  { key: 'M9', label: 'M9', fullName: 'Mistik 9', pairs: FORMULA_TABLES.M9 },
];

export const POSITION_KEYS: PositionKey[] = ['AS', 'COP', 'KEP', 'EKOR'];

export interface DrawRow {
  AS: string;
  COP: string;
  KEP: string;
  EKOR: string;
}

export interface RowCalculation {
  isEmpty: boolean;
  isBroken: boolean;
  code: string;
  trace: string;
  steps: {
    start: number | null;
    a: number | null;
    b: number | null;
    c: number | null;
  };
}

export function lookupDigit(formula: FormulaKey, digit: number): number | null {
  const table = FORMULA_TABLES[formula];
  for (const [left, right] of table) {
    if (left === digit) return right;
    if (right === digit) return left;
  }
  return null;
}

export function calculateRow(
  row: DrawRow,
  k1: FormulaKey,
  k2: FormulaKey,
  k3: FormulaKey,
  patokan: PositionKey
): RowCalculation {
  const raw = row[patokan];
  if (raw === '' || raw === undefined || raw === null) {
    return {
      isEmpty: true,
      isBroken: false,
      code: '---',
      trace: 'isi dulu',
      steps: { start: null, a: null, b: null, c: null },
    };
  }

  const start = Number.parseInt(raw, 10);
  if (Number.isNaN(start)) {
    return {
      isEmpty: true,
      isBroken: false,
      code: '---',
      trace: 'isi dulu',
      steps: { start: null, a: null, b: null, c: null },
    };
  }

  const a = lookupDigit(k1, start);
  const b = a !== null ? lookupDigit(k2, a) : null;
  const c = a !== null && b !== null ? lookupDigit(k3, b) : null;

  if (a === null || b === null || c === null) {
    return {
      isEmpty: false,
      isBroken: true,
      code: 'PUTUS',
      trace: `${patokan} ${start} → ${a ?? '×'} → ${b ?? '×'} → ${c ?? '×'}`,
      steps: { start, a, b, c },
    };
  }

  return {
    isEmpty: false,
    isBroken: false,
    code: `${a}${b}${c}`,
    trace: `${patokan} ${start} → ${a} → ${b} → ${c}`,
    steps: { start, a, b, c },
  };
}
