import { useEffect, useRef, useState } from 'react';

type Op = '+' | '−' | '×' | '÷';

const fmt = (n: number) => {
  if (!Number.isFinite(n)) return 'Hata';
  const s = Number(n.toPrecision(12)).toString();
  return s.replace('.', ',');
};

const apply = (a: number, b: number, op: Op) => (op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b);

export function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true);
  const [expr, setExpr] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const value = () => Number(display.replace(',', '.'));

  const digit = (d: string) => {
    if (fresh || display === '0' || display === 'Hata') {
      setDisplay(d === ',' ? '0,' : d);
      setFresh(false);
    } else if (!(d === ',' && display.includes(',')) && display.length < 16) {
      setDisplay(display + d);
    }
  };

  const operator = (next: Op) => {
    const v = value();
    const result = acc !== null && op && !fresh ? apply(acc, v, op) : v;
    setAcc(result);
    setDisplay(fmt(result));
    setOp(next);
    setFresh(true);
    setExpr(`${fmt(result)} ${next}`);
  };

  const equals = () => {
    if (acc === null || !op) return;
    const v = value();
    const result = apply(acc, v, op);
    setExpr(`${fmt(acc)} ${op} ${fmt(v)} =`);
    setDisplay(fmt(result));
    setAcc(null);
    setOp(null);
    setFresh(true);
  };

  const clear = () => {
    setDisplay('0');
    setAcc(null);
    setOp(null);
    setFresh(true);
    setExpr('');
  };

  const keys: Array<{ label: string; kind?: 'op' | 'fn' | 'eq'; wide?: boolean; run: () => void }> = [
    { label: 'C', kind: 'fn', run: clear },
    { label: '±', kind: 'fn', run: () => setDisplay(fmt(-value())) },
    { label: '%', kind: 'fn', run: () => setDisplay(fmt(value() / 100)) },
    { label: '÷', kind: 'op', run: () => operator('÷') },
    ...['7', '8', '9'].map((d) => ({ label: d, run: () => digit(d) })),
    { label: '×', kind: 'op', run: () => operator('×') },
    ...['4', '5', '6'].map((d) => ({ label: d, run: () => digit(d) })),
    { label: '−', kind: 'op', run: () => operator('−') },
    ...['1', '2', '3'].map((d) => ({ label: d, run: () => digit(d) })),
    { label: '+', kind: 'op', run: () => operator('+') },
    { label: '0', wide: true, run: () => digit('0') },
    { label: ',', run: () => digit(',') },
    { label: '=', kind: 'eq', run: equals },
  ];

  // Klavye: rakamlar, + - * /, Enter, Backspace, Escape.
  const handlers = useRef<(e: KeyboardEvent) => void>(() => {});
  handlers.current = (e) => {
    if (/^[0-9]$/.test(e.key)) digit(e.key);
    else if (e.key === ',' || e.key === '.') digit(',');
    else if (e.key === '+') operator('+');
    else if (e.key === '-') operator('−');
    else if (e.key === '*') operator('×');
    else if (e.key === '/') operator('÷');
    else if (e.key === 'Enter' || e.key === '=') equals();
    else if (e.key === 'Escape') clear();
    else if (e.key === 'Backspace') setDisplay((d) => (d.length > 1 && !fresh ? d.slice(0, -1) : '0'));
    else return;
    e.preventDefault();
  };
  useEffect(() => {
    const el = rootRef.current?.closest('.dui-window');
    if (!el) return;
    const onKey = (e: Event) => handlers.current(e as KeyboardEvent);
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={rootRef} className="demo-calc">
      <div className="demo-calc__screen" aria-live="polite">
        <span className="demo-calc__expr">{expr || ' '}</span>
        <output className="demo-calc__value">{display}</output>
      </div>
      <div className="demo-calc__keys">
        {keys.map((k) => (
          <button
            key={k.label}
            type="button"
            className={['demo-calc__key', k.kind && `is-${k.kind}`, k.wide && 'is-wide', k.kind === 'op' && op === k.label && fresh && 'is-pending'].filter(Boolean).join(' ')}
            onClick={k.run}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
