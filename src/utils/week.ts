export function startOfUtcWeek(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfUtcWeek(now = new Date()): Date {
  const start = startOfUtcWeek(now);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export function utcVisitDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
