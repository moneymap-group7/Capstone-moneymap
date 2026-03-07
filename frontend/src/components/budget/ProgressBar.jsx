function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function ProgressBar({ value }) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  const normalized = clamp(safe, 0, 100);
  const over = safe > 100;

  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? "bg-red-500" : "bg-gray-900"}`}
          style={{ width: `${normalized}%` }}
        />
      </div>

      {over && (
        <div className="mt-1 text-xs text-red-600">Over budget ({safe.toFixed(0)}%)</div>
      )}
    </div>
  );
}