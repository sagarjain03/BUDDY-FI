const EmptyState = ({ icon = '🙂', title, description, action }) => (
  <div className="card flex flex-col items-center px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-2xl">
      {icon}
    </div>
    <h3 className="text-lg font-bold">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
