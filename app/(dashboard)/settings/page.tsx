"use client";
import { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    cascadeAlerts: true,
    slaWarnings: true,
    newCases: false,
    dailyBrief: true,
  });
  const [slaThresholds, setSlaThresholds] = useState({
    waterSupply: 72,
    roads: 96,
    electricity: 48,
    sanitation: 72,
    tax: 120,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '32px', maxWidth: 800 }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2A4A', margin: 0 }}>
            ⚙️ Settings
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
            Configure your P-CRM preferences
          </p>
        </div>

        {/* Notification Settings */}
        <div style={{ background: 'white', borderRadius: 12,
                       border: '1px solid #E2E8F0', padding: '24px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2A4A',
                        margin: '0 0 20px' }}>
            🔔 Notification Preferences
          </h2>
          {Object.entries(notifications).map(([key, value]) => {
            const labels: Record<string, string> = {
              cascadeAlerts: 'Cascade Alert Notifications',
              slaWarnings: 'SLA Breach Warnings',
              newCases: 'New Case Assignments',
              dailyBrief: 'Daily AI Situation Brief',
            };
            const descriptions: Record<string, string> = {
              cascadeAlerts: 'Get alerted when 3+ complaints cluster in same ward',
              slaWarnings: 'Get warned when cases are approaching SLA deadline',
              newCases: 'Notify when a new case is assigned to you',
              dailyBrief: 'Receive AI-generated morning brief at 8:00 AM',
            };
            return (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '12px 0',
                borderBottom: '1px solid #F1F5F9',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1B2A4A' }}>
                    {labels[key]}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    {descriptions[key]}
                  </div>
                </div>
                <div
                  onClick={() => setNotifications(prev => ({
                    ...prev, [key]: !prev[key as keyof typeof prev]
                  }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                    background: value ? '#2563EB' : '#E2E8F0',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'white', position: 'absolute',
                    top: 3, transition: 'left 0.2s',
                    left: value ? 23 : 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* SLA Thresholds */}
        <div style={{ background: 'white', borderRadius: 12,
                       border: '1px solid #E2E8F0', padding: '24px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2A4A',
                        margin: '0 0 20px' }}>
            ⏱ SLA Thresholds (hours)
          </h2>
          {Object.entries(slaThresholds).map(([key, value]) => {
            const labels: Record<string, string> = {
              waterSupply: 'Water Supply',
              roads: 'Roads & Infrastructure',
              electricity: 'Electricity',
              sanitation: 'Sanitation',
              tax: 'Tax & Finance',
            };
            return (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '10px 0',
                borderBottom: '1px solid #F1F5F9',
              }}>
                <label style={{ fontSize: 14, color: '#1B2A4A', fontWeight: 500 }}>
                  {labels[key]}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setSlaThresholds(prev => ({
                    ...prev, [key]: Number(e.target.value)
                  }))}
                  style={{
                    width: 80, padding: '6px 10px', border: '1px solid #E2E8F0',
                    borderRadius: 6, fontSize: 14, textAlign: 'center',
                    color: '#1B2A4A', fontWeight: 600,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            background: saved ? '#16A34A' : '#2563EB',
            color: 'white', border: 'none', borderRadius: 8,
            padding: '12px 32px', cursor: 'pointer',
            fontSize: 15, fontWeight: 600, width: '100%',
          }}
        >
          {saved ? '✅ Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
