import { Injectable } from "@nestjs/common";
import type { SpendCategory } from "@prisma/client";

import {
  BudgetUtilizationRow,
  BudgetAlert,
} from "./alert.types";
import type { ThresholdRule } from "./thresholds";
import {
  DEFAULT_THRESHOLD_RULES,
  SEVERITY_RANK,
  DEFAULT_IGNORED_CATEGORIES,
  normalizeRules,
} from "./thresholds";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function safeNumber(n: unknown, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

@Injectable()
export class AlertsService {
  evaluateAlerts(
    rows: BudgetUtilizationRow[],
    opts?: {
      rules?: ThresholdRule[];
      ignoredCategories?: SpendCategory[];
    }
  ): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    const rules = normalizeRules(opts?.rules ?? DEFAULT_THRESHOLD_RULES);
    const ignored = new Set<SpendCategory>(
      opts?.ignoredCategories ?? DEFAULT_IGNORED_CATEGORIES
    );

    for (const row of rows) {
      const spendCategory = row.spendCategory;

      if (ignored.has(spendCategory)) continue;

      const budget = safeNumber(row.budgetLimit, 0);
      const spendRaw = safeNumber(row.currentSpend, 0);
      const spend = Math.abs(spendRaw);
      const pctRaw = safeNumber(row.utilizationPercent, 0);
      const pct = round2(pctRaw);

      if (spend === 0) continue;

      const remaining = round2(Math.max(budget - spend, 0));
      const exceeded = round2(Math.max(spend - budget, 0));

      // Spending exists, but no budget is set
      if (budget <= 0) {
        alerts.push({
          spendCategory,
          severity: "CRITICAL",
          thresholdPercent: 0,
          currentPercent: 0,
          budgetLimit: round2(budget),
          currentSpend: round2(spend),
          remainingAmount: 0,
          exceededAmount: round2(spend),
          message: `No budget set for ${spendCategory}, but $${spend.toFixed(
            2
          )} has been spent.`,
        });
        continue;
      }

      // If over budget, always make it critical
      if (pctRaw >= 100) {
        alerts.push({
          spendCategory,
          severity: "CRITICAL",
          thresholdPercent: 100,
          currentPercent: pct,
          budgetLimit: round2(budget),
          currentSpend: round2(spend),
          remainingAmount: remaining,
          exceededAmount: exceeded,
          message: `${spendCategory} exceeded budget by $${exceeded.toFixed(
            2
          )} (${pct.toFixed(2)}%).`,
        });
        continue;
      }

      // Find triggered thresholds below 100
      const triggered = rules.filter((r) => pctRaw >= r.percent);
      if (triggered.length === 0) continue;

      const highest = triggered.reduce((max, cur) => {
        const curRank = SEVERITY_RANK[cur.severity];
        const maxRank = SEVERITY_RANK[max.severity];

        if (curRank !== maxRank) return curRank > maxRank ? cur : max;
        return cur.percent > max.percent ? cur : max;
      });

      alerts.push({
        spendCategory,
        severity: highest.severity,
        thresholdPercent: highest.percent,
        currentPercent: pct,
        budgetLimit: round2(budget),
        currentSpend: round2(spend),
        remainingAmount: remaining,
        exceededAmount: exceeded,
        message: `${spendCategory} is at ${pct.toFixed(
          2
        )}% of budget with $${remaining.toFixed(2)} remaining.`,
      });
    }

    alerts.sort((a, b) => {
      const rankDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (rankDiff !== 0) return rankDiff;
      return b.currentPercent - a.currentPercent;
    });

    return alerts;
  }
}