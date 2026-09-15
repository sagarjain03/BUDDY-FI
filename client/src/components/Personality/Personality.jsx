const Personality = ({ traits = [] }) => {
  if (traits.length === 0) {
    return (
      <p className="text-sm text-ink-400">
        Finish the quiz and your answers will show up here.
      </p>
    );
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {traits.map((trait) => (
        <div
          key={trait.name}
          className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-4 py-3"
        >
          <span className="text-lg" aria-hidden="true">
            {trait.icon}
          </span>
          <div className="min-w-0">
            <dt className="text-xs uppercase tracking-wider text-ink-400">{trait.name}</dt>
            <dd className="truncate text-sm font-semibold text-ink-800">
              {trait.value || 'Not answered'}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
};

export default Personality;
