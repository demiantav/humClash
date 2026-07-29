export interface ReportEntry {
  reporterId: string;
  reportedId: string;
  roomCode: string;
  reason: string;
  timestamp: number;
}

const reports: ReportEntry[] = [];

export function addReport(report: ReportEntry): void {
  reports.push(report);
  console.log(`[report] Room ${report.roomCode} — ${report.reason} — reporter: ${report.reporterId}`);
}

export function getReports(): ReportEntry[] {
  return [...reports];
}

export function clearReports(): void {
  reports.length = 0;
}
