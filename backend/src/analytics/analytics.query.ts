import { BadRequestException } from "@nestjs/common";

export function parseDateRange(
  query: Record<string, any>,
  defaults: { daysBack: number },
) {
  // Reject wrong param names explicitly (avoid silent fallback)
  if ("startDate" in query || "endDate" in query) {
    throw new BadRequestException(
      'Use query params "start" and "end" (not startDate/endDate).',
    );
  }

  const now = new Date();
  const end = query.end ? new Date(String(query.end)) : now;

  if (query.end && Number.isNaN(end.getTime())) {
    throw new BadRequestException(
      'Invalid "end" date. Use ISO, e.g. 2026-02-19 or 2026-02-19T00:00:00Z.',
    );
  }

  const start = query.start
    ? new Date(String(query.start))
    : new Date(end.getTime() - defaults.daysBack * 24 * 60 * 60 * 1000);

  if (query.start && Number.isNaN(start.getTime())) {
    throw new BadRequestException(
      'Invalid "start" date. Use ISO, e.g. 2026-01-20 or 2026-01-20T00:00:00Z.',
    );
  }

  if (start > end) {
    throw new BadRequestException('"start" must be <= "end".');
  }

  return { startDate: start, endDate: end };
}