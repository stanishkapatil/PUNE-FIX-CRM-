"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, role } = useAuth();

  return (
    <div style={{ padding: '32px' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
      }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          color: '#1B2A4A', margin: 0,
        }}>
          Good morning, {user?.displayName || 'Staff'} 👋
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10,
            borderRadius: '50%', background: '#16A34A',
          }} />
          <div style={{
            width: 36, height: 36,
            borderRadius: '50%', background: '#E2E8F0',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16,
          }}>
            👤
          </div>
        </div>
      </div>

      {/* AI Brief Card */}
      <div style={{
        background: 'white', borderRadius: 12,
        border: '1px solid #E2E8F0',
        padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <span style={{
              fontSize: 15, fontWeight: 700, color: '#1B2A4A',
            }}>
              AI Situation Brief
            </span>
          </div>
          <button style={{
            background: 'none', border: 'none',
            color: '#2563EB', cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
          }}>
            Refresh ↺
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 12px' }}>
          Generated at 8:30 AM
        </p>
        <div style={{
          background: '#EFF6FF',
          borderLeft: '3px solid #2563EB',
          borderRadius: 8, padding: '12px 16px',
          fontSize: 14, color: '#1B2A4A', lineHeight: 1.6,
        }}>
          3 critical water supply cases in Ward 7 require immediate 
          attention — cascade pattern detected. Officer Kumar is 
          approaching SLA breach on Case #1038. Prioritize water 
          cases before electrical queue today.
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: 24,
      }}>
        {[
          { label: 'Open Cases', value: '47',
            sub: '+3 today', color: '#1B2A4A', subColor: '#D97706' },
          { label: 'Resolved Today', value: '12',
            sub: '↑ 1 from 8 yesterday', color: '#16A34A',
            subColor: '#16A34A' },
          { label: 'SLA At Risk', value: '5',
            sub: '⚠ Need attention', color: '#DC2626',
            subColor: '#DC2626' },
          { label: 'Avg Resolution', value: '1.8 days',
            sub: '↓ 0.5 days this week', color: '#1B2A4A',
            subColor: '#16A34A' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 12,
            border: '1px solid #E2E8F0', padding: '20px',
          }}>
            <p style={{
              fontSize: 13, color: '#64748B',
              margin: '0 0 8px',
            }}>
              {card.label}
            </p>
            <p style={{
              fontSize: 28, fontWeight: 700,
              color: card.color, margin: '0 0 6px',
            }}>
              {card.value}
            </p>
            <p style={{
              fontSize: 12, color: card.subColor, margin: 0,
            }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Cascade Alert */}
      <div style={{
        background: '#FEF2F2',
        borderTop: '1px solid #FECACA',
        borderRight: '1px solid #FECACA',
        borderBottom: '1px solid #FECACA',
        borderLeft: '4px solid #DC2626',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontWeight: 700, color: '#DC2626', fontSize: 15,
          }}>
            🚨 CASCADE ALERT — Water Supply · Ward 7
          </div>
          <div style={{
            color: '#991B1B', fontSize: 13, marginTop: 4,
          }}>
            4 complaints in 72 hours · Probable systemic issue
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => router.push('/cases')}
            style={{
              background: '#2563EB', color: 'white',
              border: 'none', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}>
            View Cases →
          </button>
          <button style={{
            background: 'white', color: '#DC2626',
            border: '1px solid #FECACA',
            borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            Escalate
          </button>
        </div>
      </div>

    </div>
  );
}
