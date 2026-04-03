"use client";
import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

const stats = {
  totalCases: 247,
  resolvedThisWeek: 38,
  avgResolutionDays: 1.8,
  slaCompliance: 91,
  citizenSatisfaction: 4.2,
};

const categoryData = [
  { name: 'Water Supply', count: 82, resolved: 71, color: '#2563EB' },
  { name: 'Roads & Infrastructure', count: 64, resolved: 43, color: '#0D9488' },
  { name: 'Sanitation', count: 45, resolved: 40, color: '#16A34A' },
  { name: 'Electricity', count: 31, resolved: 28, color: '#D97706' },
  { name: 'Tax & Finance', count: 25, resolved: 22, color: '#7C3AED' },
];

const weeklyData = [
  { day: 'Mon', submitted: 12, resolved: 9 },
  { day: 'Tue', submitted: 18, resolved: 15 },
  { day: 'Wed', submitted: 8, resolved: 11 },
  { day: 'Thu', submitted: 22, resolved: 17 },
  { day: 'Fri', submitted: 15, resolved: 14 },
  { day: 'Sat', submitted: 6, resolved: 8 },
  { day: 'Sun', submitted: 4, resolved: 5 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');

  const handleDownload = () => {
    const reportData = `P-CRM Weekly Report
Generated: ${new Date().toLocaleDateString('en-IN')}

SUMMARY
-------
Total Cases: ${stats.totalCases}
Resolved This Week: ${stats.resolvedThisWeek}
Avg Resolution Time: ${stats.avgResolutionDays} days
SLA Compliance: ${stats.slaCompliance}%
Citizen Satisfaction: ${stats.citizenSatisfaction}/5.0

CATEGORY BREAKDOWN
------------------
${categoryData.map(c => `${c.name}: ${c.count} total, ${c.resolved} resolved`).join('\n')}

DAILY BREAKDOWN (This Week)
----------------------------
${weeklyData.map(d => `${d.day}: ${d.submitted} submitted, ${d.resolved} resolved`).join('\n')}
`;
    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PCRM-Report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
                       alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2A4A', margin: 0 }}>
              📊 Reports
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
              Performance analytics and department insights
            </p>
          </div>
          <button
            onClick={handleDownload}
            style={{
              background: '#1B2A4A', color: 'white', border: 'none',
              borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            ⬇ Download Report
          </button>
        </div>

        {/* Period Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['week', 'month', 'quarter'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: period === p ? '#2563EB' : 'white',
              color: period === p ? 'white' : '#64748B',
              borderColor: period === p ? '#2563EB' : '#E2E8F0',
            }}>
              {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Quarter'}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                       gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Cases', value: stats.totalCases, color: '#2563EB', icon: '📋' },
            { label: 'Resolved', value: stats.resolvedThisWeek, color: '#16A34A', icon: '✅' },
            { label: 'SLA Compliance', value: `${stats.slaCompliance}%`, color: '#0D9488', icon: '⏱' },
            { label: 'Avg Days', value: stats.avgResolutionDays, color: '#D97706', icon: '📅' },
          ].map((card, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 12,
              border: '1px solid #E2E8F0', padding: '20px',
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Category Breakdown */}
          <div style={{ background: 'white', borderRadius: 12,
                         border: '1px solid #E2E8F0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16,
                          fontWeight: 700, color: '#1B2A4A' }}>
              Cases by Category
            </h3>
            {categoryData.map((cat, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                               marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: '#1B2A4A', fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ color: '#64748B' }}>{cat.resolved}/{cat.count}</span>
                </div>
                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: cat.color,
                    width: `${(cat.resolved / cat.count) * 100}%`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Bar Chart */}
          <div style={{ background: 'white', borderRadius: 12,
                         border: '1px solid #E2E8F0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16,
                          fontWeight: 700, color: '#1B2A4A' }}>
              Daily Activity This Week
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end',
                           gap: 12, height: 160, paddingBottom: 24,
                           borderBottom: '1px solid #E2E8F0' }}>
              {weeklyData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex',
                                       flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', display: 'flex', gap: 2,
                                 alignItems: 'flex-end', height: 130 }}>
                    <div style={{
                      flex: 1, background: '#BFDBFE', borderRadius: '3px 3px 0 0',
                      height: `${(d.submitted / 22) * 100}%`,
                    }} />
                    <div style={{
                      flex: 1, background: '#2563EB', borderRadius: '3px 3px 0 0',
                      height: `${(d.resolved / 22) * 100}%`,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{d.day}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, background: '#BFDBFE',
                                borderRadius: 2, display: 'inline-block' }} />
                Submitted
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, background: '#2563EB',
                                borderRadius: 2, display: 'inline-block' }} />
                Resolved
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
