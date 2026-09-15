import { useCallback, useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import { apiFetch } from '../lib/api';

const FILTERS = ['open', 'reviewing', 'actioned', 'dismissed', 'all'];

const STATUS_STYLES = {
  open: 'bg-brand-50 text-brand-700',
  reviewing: 'bg-ink-100 text-ink-700',
  actioned: 'bg-accent-400/15 text-accent-600',
  dismissed: 'bg-ink-100 text-ink-400',
};

const CATEGORY_LABELS = {
  harassment: 'Harassment',
  spam: 'Spam',
  'fake-profile': 'Fake profile',
  'inappropriate-content': 'Inappropriate content',
  other: 'Other',
};

/**
 * A minimal queue. Reports nobody reads are worse than no report button, so
 * this exists from the day reporting does.
 */
const AdminReports = () => {
  const [filter, setFilter] = useState('open');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`;
      const result = await apiFetch(`/api/admin/reports${query}`);
      setReports(result.data.reports);
    } catch (err) {
      if (/admin/i.test(err.message)) setForbidden(true);
      setError(err.message || 'Could not load reports');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/reports/${id}`, { method: 'PATCH', body: { status } });
      await load();
    } catch (err) {
      setError(err.message || 'Could not update that report');
    } finally {
      setBusyId(null);
    }
  };

  if (forbidden) {
    return (
      <AppShell title="Reports" width="narrow">
        <EmptyState
          icon="🔒"
          title="Admins only"
          description="This queue is only visible to accounts with the admin role."
          action={
            <Button to="/welcome" variant="outline">
              Back to BUDDYFI
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Reports"
      subtitle="What members have flagged, newest first."
      actions={
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      }
    >
      {error && !forbidden && (
        <Alert tone="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-ink-200 bg-white p-1">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === value ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="card space-y-3 p-5">
              <div className="skeleton h-4 w-1/3 rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <EmptyState
          icon="✅"
          title={filter === 'open' ? 'Nothing waiting' : 'Nothing here'}
          description="Reports members file will appear in this queue."
        />
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report._id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold">
                    {CATEGORY_LABELS[report.category] || report.category}
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    <span className="font-medium text-ink-700">
                      {report.reported?.name || 'Unknown'}
                    </span>{' '}
                    reported by {report.reporter?.name || 'Unknown'} on{' '}
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    STATUS_STYLES[report.status] || STATUS_STYLES.open
                  }`}
                >
                  {report.status}
                </span>
              </div>

              {report.details && (
                <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700">
                  {report.details}
                </p>
              )}

              {report.reviewedBy && (
                <p className="mt-3 text-xs text-ink-400">
                  Last handled by {report.reviewedBy.name}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {['reviewing', 'actioned', 'dismissed'].map((next) => (
                  <Button
                    key={next}
                    variant={next === 'actioned' ? 'primary' : 'outline'}
                    onClick={() => setStatus(report._id, next)}
                    disabled={busyId === report._id || report.status === next}
                    className="capitalize"
                  >
                    {next}
                  </Button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default AdminReports;
