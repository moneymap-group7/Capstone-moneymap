import {
  BudgetUtilizationRow,
  BudgetAlert,
  AlertSeverity,
} from "./alert.types";

import {
  DEFAULT_THRESHOLD_RULES,
  SEVERITY_RANK,
} from "./thresholds";

export class AlertsService {
  evaluateAlerts(
    rows: BudgetUtilizationRow[]
  ): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    for (const row of rows) {
      const {
        spendCategory,
        budgetLimit,
        currentSpend,
        utilizationPercent,
      } = row;

      // Skip categories without budget
      if (!budgetLimit || Number(budgetLimit) <= 0) continue;

      // Skip income/transfer categories
      if (spendCategory === "INCOME" || spendCategory === "TRANSFER") {
        continue;
      }

      // Find all triggered thresholds
      const triggered = DEFAULT_THRESHOLD_RULES.filter(
        (rule) => utilizationPercent >= rule.percent
      );

      if (triggered.length === 0) continue;

      // Pick highest severity
      const highest = triggered.reduce((max, current) =>
      SEVERITY_RANK[current.severity] > SEVERITY_RANK[max.severity]
        ? current
        : max
      );

      const budget = Number(budgetLimit);
      const spend = Number(currentSpend);

      const remaining = Math.max(budget - spend, 0);
      const exceeded = spend > budget ? spend - budget : 0;

      alerts.push({
        spendCategory,
        severity: highest.severity,
        thresholdPercent: highest.percent,
        currentPercent: utilizationPercent,
        budgetLimit,
        currentSpend,
        remainingAmount: remaining.toFixed(2),
        exceededAmount: exceeded.toFixed(2),
        message:
          spend > budget
            ? `${spendCategory} exceeded budget by ${exceeded.toFixed(
                2
              )} (${utilizationPercent}%).`
            : `${spendCategory} is at ${utilizationPercent}% of budget (${remaining.toFixed(
                2
              )} remaining).`,
      });
    }

    return alerts;
  }
}