'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { applicationsApi, dashboardApi, emailApi } from '@/lib/api';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    company: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        dashboardApi.stats(),
        applicationsApi.list(filters),
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedApps);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedApps(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedApps.size === applications.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(applications.map((app) => app.id)));
    }
  };

  const handleSendEmails = async () => {
    if (selectedApps.size === 0) return;

    setSending(true);
    try {
      await emailApi.send({
        application_ids: Array.from(selectedApps),
      });
      alert('Emails sent successfully!');
      setSelectedApps(new Set());
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-pending',
      email_sent: 'badge-sent',
      failed: 'badge-failed',
      no_contact_found: 'badge-no-contact',
    };
    return badges[status] || 'badge';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      email_sent: 'Email Sent',
      failed: 'Failed',
      no_contact_found: 'No Contact',
      manual_review: 'Manual Review',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card">
              <div className="text-sm text-gray-600">Total Applications</div>
              <div className="text-2xl font-bold">{stats.total_applications}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">Emails Sent</div>
              <div className="text-2xl font-bold text-green-600">{stats.emails_sent}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">Failed</div>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">No Contact</div>
              <div className="text-2xl font-bold text-gray-600">{stats.no_contact_found}</div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-4 flex-1 w-full md:w-auto">
              <input
                type="text"
                placeholder="Filter by company"
                className="input flex-1"
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              />
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="email_sent">Email Sent</option>
                <option value="failed">Failed</option>
                <option value="no_contact_found">No Contact</option>
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={handleSendEmails}
              disabled={selectedApps.size === 0 || sending}
            >
              {sending ? 'Sending...' : `Send Emails (${selectedApps.size})`}
            </button>
          </div>
        </div>

        {/* Applications Table */}
        <div className="card overflow-x-auto">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">No applications found</p>
              <p className="text-sm">
                Use the Chrome extension to sync your LinkedIn applications
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedApps.size === applications.length}
                      onChange={toggleAllSelection}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Job Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Applied Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recruiter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedApps.has(app.id)}
                        onChange={() => toggleSelection(app.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={app.job_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {app.job_title}
                      </a>
                    </td>
                    <td className="px-4 py-3">{app.company_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{app.location || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(app.application_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{app.recruiter_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{app.recruiter_email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(app.status)}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
