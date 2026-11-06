import { useId } from 'react';
interface Props {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
}
/** Draft inputs remain strings until a form is submitted; partial numbers never enter the domain. */
export function NumberField({ label, value, onChange, step = 0.1, min, max, hint }: Props) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        max={max}
        required
      />
      {hint && <small>{hint}</small>}
    </div>
  );
}
