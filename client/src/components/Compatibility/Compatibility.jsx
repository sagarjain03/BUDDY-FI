/** Progress ring showing how complete a profile is. */
const Compatibility = ({ score = 0, label = 'Profile complete' }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#FF5A1F ${clamped * 3.6}deg, #E9EBF2 0deg)`,
        }}
        role="img"
        aria-label={`${label}: ${clamped} percent`}
      >
        <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white">
          <span className="font-display text-lg font-bold text-ink-900">{clamped}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-800">{label}</p>
        <p className="mt-0.5 text-xs text-ink-400">
          {clamped === 100 ? 'All seven answers saved' : 'Answer every question to hit 100%'}
        </p>
      </div>
    </div>
  );
};

export default Compatibility;
