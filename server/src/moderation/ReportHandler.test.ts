import { describe, it, expect, beforeEach } from "vitest";
import { addReport, getReports, clearReports } from "./ReportHandler.js";

describe("ReportHandler", () => {
  beforeEach(() => {
    clearReports();
  });

  it("starts empty", () => {
    expect(getReports()).toEqual([]);
  });

  it("addReport accumulates entries", () => {
    addReport({
      reporterId: "a",
      reportedId: "b",
      roomCode: "ABC123",
      reason: "spam",
      timestamp: 1000,
    });
    addReport({
      reporterId: "c",
      reportedId: "d",
      roomCode: "XYZ789",
      reason: "abuse",
      timestamp: 2000,
    });
    expect(getReports()).toHaveLength(2);
    expect(getReports()[0].reason).toBe("spam");
    expect(getReports()[1].roomCode).toBe("XYZ789");
  });

  it("getReports returns a copy (not the internal array)", () => {
    addReport({
      reporterId: "a",
      reportedId: "b",
      roomCode: "ABC123",
      reason: "spam",
      timestamp: 1000,
    });
    const copy = getReports();
    copy.push({
      reporterId: "x",
      reportedId: "y",
      roomCode: "HACK",
      reason: "x",
      timestamp: 0,
    });
    expect(getReports()).toHaveLength(1);
  });
});
