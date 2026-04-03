import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// ─── Simple in-memory lock ───────────────────────────────────────────────────
// Prevents duplicate runs if cron-job.org fires twice simultaneously
let isRunning = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(message: string, data?: unknown) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'recalculate-scores',
      message,
      ...(data ? { data } : {}),
    })
  );
}

function unauthorized() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

// ─── Score Calculation Logic ──────────────────────────────────────────────────
async function recalculateAllScores(): Promise<{
  processed: number;
  failed: number;
  skipped: number;
}> {
  const results = { processed: 0, failed: 0, skipped: 0 };

  // Fetch all open cases from Firestore
  const snapshot = await db
    .collection('cases')
    .where('status', '!=', 'closed')
    .get();

  if (snapshot.empty) {
    log('No open cases found — nothing to recalculate');
    return results;
  }

  const batch = db.batch();

  for (const doc of snapshot.docs) {
    try {
      const caseData = doc.data();

      // ── Priority Score Formula ──────────────────────────────────────────
      // Priority = (urgency × 0.40) + (SLA_remaining_inverse × 0.30)
      //          + (vulnerable_flag × 0.20) + (recurrence × 0.10)
      const urgencyScore = caseData.urgencyScore ?? 50;

      const createdAt = caseData.createdAt?.toDate?.() ?? new Date();
      const slaDurations: Record<string, number> = {
        'Water Supply': 72,
        'Roads & Infrastructure': 96,
        'Electricity': 48,
        'Sanitation': 72,
        'Tax & Finance': 120,
        'Other': 96,
      };
      const totalSLAHours =
        slaDurations[caseData.category as string] ?? 96;
      const hoursElapsed =
        (Date.now() - createdAt.getTime()) / 3600000;
      const timeUsedRatio = Math.min(hoursElapsed / totalSLAHours, 1);
      const slaRemainingInverse = (1 - timeUsedRatio) * 100;

      const vulnerabilityScore = caseData.vulnerableFlag ? 100 : 0;
      const recurrenceScore = caseData.isRecurring ? 100 : 0;

      const priorityScore =
        urgencyScore * 0.40 +
        slaRemainingInverse * 0.30 +
        vulnerabilityScore * 0.20 +
        recurrenceScore * 0.10;

      const isSLAAtRisk = timeUsedRatio >= 0.80;

      // ── Batch write updated score ───────────────────────────────────────
      batch.update(doc.ref, {
        priorityScore: Math.round(priorityScore),
        slaRemainingInverse: Math.round(slaRemainingInverse),
        isSLAAtRisk,
        lastScoreUpdate: new Date(),
      });

      results.processed++;
    } catch (err) {
      log(`Failed to process case ${doc.id}`, { error: String(err) });
      results.failed++;
    }
  }

  // Commit all updates in one batch (efficient — 1 write operation)
  await batch.commit();

  return results;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {

  // ── 1. Authenticate ────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedToken) {
    log('Unauthorized cron attempt blocked');
    return unauthorized();
  }

  // ── 2. Prevent duplicate runs ──────────────────────────────────────────────
  if (isRunning) {
    log('Job already running — skipping this trigger');
    return NextResponse.json(
      { message: 'Job already in progress', skipped: true },
      { status: 200 }
    );
  }

  // ── 3. Execute ────────────────────────────────────────────────────────────
  isRunning = true;
  const startTime = Date.now();
  log('Cron job started');

  try {
    const results = await recalculateAllScores();
    const duration = Date.now() - startTime;

    // ── 4. Log execution to Firestore (audit trail) ───────────────────────
    await db.collection('cron_logs').add({
      job: 'recalculate-scores',
      status: 'success',
      duration,
      results,
      executedAt: new Date(),
    });

    log('Cron job completed', { duration, results });

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      results,
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    // ── Log failure to Firestore ───────────────────────────────────────────
    await db.collection('cron_logs').add({
      job: 'recalculate-scores',
      status: 'failed',
      error: String(error),
      duration,
      executedAt: new Date(),
    });

    log('Cron job FAILED', { error: String(error), duration });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );

  } finally {
    // ── Always release lock, even if job crashes ───────────────────────────
    isRunning = false;
  }
}

// Block all other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}