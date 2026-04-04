// scripts/test-fine-calc.ts
import { calculateContributionFine } from "../lib/fines/calculateContributionFine";

function test() {
  console.log("--- Starting Fine Calculation Tests ---");

  const dueDate = new Date("2026-04-01T00:00:00Z");
  
  // Scenario 1: Paid on time (calculation date = due date)
  const case1 = calculateContributionFine({
    contributionId: "TEST-1",
    dueDate,
    scheduledAmount: 2000,
    amountPaid: 0,
    status: "PENDING",
    flatFeeApplied: 200,
    dailyRateApplied: 0.5,
    fineEnabled: true,
    calculationDate: new Date("2026-04-01T12:00:00Z")
  });
  console.log("Scenario 1 (On Time):", case1.totalFine === 0 ? "PASSED" : "FAILED", `(Fine: ${case1.totalFine})`);

  // Scenario 2: 1 Day Late
  const case2 = calculateContributionFine({
    contributionId: "TEST-2",
    dueDate,
    scheduledAmount: 2000,
    amountPaid: 0,
    status: "OVERDUE",
    flatFeeApplied: 200,
    dailyRateApplied: 0.5,
    fineEnabled: true,
    calculationDate: new Date("2026-04-02T12:00:00Z")
  });
  // Expected: 200 (flat) + 2000 * 0.005 * 1 (daily) = 210
  console.log("Scenario 2 (1 Day Late):", case2.totalFine === 210 ? "PASSED" : "FAILED", `(Fine: ${case2.totalFine})`);

  // Scenario 3: 15 Days Late
  const case3 = calculateContributionFine({
    contributionId: "TEST-3",
    dueDate,
    scheduledAmount: 2000,
    amountPaid: 0,
    status: "OVERDUE",
    flatFeeApplied: 200,
    dailyRateApplied: 0.5,
    fineEnabled: true,
    calculationDate: new Date("2026-04-16T12:00:00Z")
  });
  // Expected: 200 (flat) + 2000 * 0.005 * 15 (daily) = 200 + 150 = 350
  console.log("Scenario 3 (15 Days Late):", case3.totalFine === 350 ? "PASSED" : "FAILED", `(Fine: ${case3.totalFine})`);

  // Scenario 4: Partial Payment (Daily penalty on original amount)
  const case4 = calculateContributionFine({
    contributionId: "TEST-4",
    dueDate,
    scheduledAmount: 2000,
    amountPaid: 1000,
    status: "PARTIAL",
    flatFeeApplied: 200,
    dailyRateApplied: 0.5,
    fineEnabled: true,
    calculationDate: new Date("2026-04-02T12:00:00Z")
  });
  // Expected: 210
  console.log("Scenario 4 (Partial Payment):", case4.totalFine === 210 ? "PASSED" : "FAILED", `(Fine: ${case4.totalFine})`);

  console.log("--- Tests Completed ---");
}

test();
