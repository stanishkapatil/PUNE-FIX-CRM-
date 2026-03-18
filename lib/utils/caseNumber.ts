function pad4(n: number): string {
  const s = Math.floor(Math.abs(n)).toString();
  return s.length >= 4 ? s.slice(-4) : s.padStart(4, "0");
}

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0 || !Number.isFinite(maxExclusive)) {
    throw new Error("randomInt: maxExclusive must be a positive finite number");
  }

  // Prefer Web Crypto when available (both browser + Node 18+)
  const g: any = globalThis as any;
  const cryptoObj: Crypto | undefined = g.crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    return buf[0]! % maxExclusive;
  }

  // Fallback (should be rare in modern Next.js runtimes)
  return Math.floor(Math.random() * maxExclusive);
}

export function generateCaseNumber(date: Date = new Date()): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("generateCaseNumber: date must be a valid Date");
  }

  const year = date.getFullYear();
  const seq = randomInt(10000);
  return `PCRM-${year}-${pad4(seq)}`;
}

