"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';

interface Alert {
  id: string;
  type: 'cascade' | 'sla' | 'escalation';
  title: string;
  message: string;
  ward: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  timestamp: string;
  isRead: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'cascade',
    title: 'CASCADE ALERT — Water Supply',
    message: '5 complaints in Ward 7 within 72 hours. Probable systemic issue.',
    ward: 'Ward 7',
    category: 'Water Supply',
    severity: 'CRITICAL',
    timestamp: '2 hours ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'sla',
    title: 'SLA BREACH WARNING — Case #1042',
    message: 'Case #1042 has only 3 hours remaining before SLA breach.',
    ward: 'Ward 7',
    category: 'Water Supply',
    severity: 'HIGH',
    timestamp: '3 hours ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'escalation',
    title: 'ESCALATION — Case #1039',
    message: 'Officer requested supervisor review for pothole case in Ward 3.',
    ward: 'Ward 3',
    category: 'Roads',
    severity: 'MEDIUM',
    timestamp: '5 hours ago',
    isRead: true,
  },
  {
    id: '4',
    type: 'cascade',
    title: 'CASCADE ALERT — Sanitation',
    message: '3 garbage collection complaints in Ward 5 within 48 hours.',
    ward: 'Ward 5',
    category: 'Sanitation',
    severity: 'HIGH',
    timestamp: '6 hours ago',
    isRead: true,
  },
  {
    id: '5',
    type: 'sla',
    title: 'SLA BREACH WARNING — Case #1035',
    message: 'Case #1035 electricity issue has breached SLA by 2 hours.',
    ward: 'Ward 11',
    category: 'Electricity',
    severity: 'CRITICAL',
    timestamp: '1 day ago',
    isRead: true,
  },
];

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'unread' | 'cascade' | 'sla'>('all');

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.isRead;
    if (filter === 'cascade') return a.type === 'cascade';
    if (filter === 'sla') return a.type === 'sla';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const markRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const getSeverityStyle = (severity: string) => {
    if (severity === 'CRITICAL') return {
      bg: '#FEF2F2', border: '#DC2626', color: '#DC2626', badge: '#DC2626'
    };
    if (severity === 'HIGH') return {
      bg: '#FFF7ED', border: '#D97706', color: '#D97706', badge: '#D97706'
    };
    return {
      bg: '#FEFCE8', border: '#CA8A04', color: '#CA8A04', badge: '#CA8A04'
    };
  };

  const getTypeIcon = (type: string) => {
    if (type === 'cascade') return '🔴';
    if (type === 'sla') return '⏰';
    return '📢';
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
              🔔 Alerts Center
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
              {unreadCount} unread alerts requiring attention
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: '#2563EB', color: 'white', border: 'none',
                borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
              }}
            >
              ✓ Mark All Read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['all', 'unread', 'cascade', 'sla'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 20, border: '1px solid',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: filter === f ? '#2563EB' : 'white',
                color: filter === f ? 'white' : '#64748B',
                borderColor: filter === f ? '#2563EB' : '#E2E8F0',
              }}
            >
              {f === 'all' ? `All (${alerts.length})` :
               f === 'unread' ? `Unread (${unreadCount})` :
               f === 'cascade' ? 'Cascade' : 'SLA Warnings'}
            </button>
          ))}
        </div>

        {/* Alert Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              color: '#94A3B8', fontSize: 15,
            }}>
              ✅ No alerts in this category
            </div>
          )}
          {filtered.map(alert => {
            const s = getSeverityStyle(alert.severity);
            return (
              <div
                key={alert.id}
                onClick={() => markRead(alert.id)}
                style={{
                  background: alert.isRead ? 'white' : s.bg,
                  border: `1px solid ${alert.isRead ? '#E2E8F0' : s.border}`,
                  borderLeft: `4px solid ${s.border}`,
                  borderRadius: 12, padding: '20px 24px',
                  cursor: 'pointer',
                  opacity: alert.isRead ? 0.75 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between',
                               alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                                   marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{getTypeIcon(alert.type)}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1B2A4A' }}>
                        {alert.title}
                      </span>
                      {!alert.isRead && (
                        <span style={{
                          background: s.badge, color: 'white',
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 20,
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: 14, color: '#475569' }}>
                      {alert.message}
                    </p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12,
                                   color: '#94A3B8' }}>
                      <span>📍 {alert.ward}</span>
                      <span>🏷 {alert.category}</span>
                      <span>🕐 {alert.timestamp}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push('/dashboard'); }}
                      style={{
                        background: '#2563EB', color: 'white', border: 'none',
                        borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                      }}
                    >
                      View Cases →
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); alert && markRead(alert.id); }}
                      style={{
                        background: 'white', color: '#64748B',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                        fontSize: 12, whiteSpace: 'nowrap',
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
