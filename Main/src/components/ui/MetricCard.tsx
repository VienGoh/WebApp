type Props = {
  title: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export default function MetricCard({ title, value, hint, className }: Props) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ring-1 ring-black/0 transition hover:shadow-md ${className || ""}`}>
      <div className="text-slate-500 text-sm">{title}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}
