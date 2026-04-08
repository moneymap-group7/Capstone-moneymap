import { Injectable } from "@nestjs/common";
import { SpendCategory, TransactionType } from "@prisma/client";
import { AUTO_CATEGORIZE_RULES, CategorizeInput } from "./auto-categorize.rules";

function normalizeDesc(desc: string): string {
  return (desc ?? "").replace(/\s+/g, " ").trim().toUpperCase();
}

function matches(descNorm: string, pattern: RegExp | string): boolean {
  if (typeof pattern === "string") return descNorm.includes(pattern.toUpperCase());
  return pattern.test(descNorm);
}

@Injectable()
export class AutoCategorizeService {
  categorize(input: CategorizeInput): SpendCategory {
    const descNorm = normalizeDesc(input.description);

    if (!descNorm) return SpendCategory.UNCATEGORIZED;

    // Special-case: if CREDIT and looks like income keywords, rules will catch it.
    // Otherwise, rules decide.

    let best: { category: SpendCategory; priority: number } | null = null;

    for (const rule of AUTO_CATEGORIZE_RULES) {
      const hit = rule.anyOf.some((p) => matches(descNorm, p));
      if (!hit) continue;

      if (!best || rule.priority > best.priority) {
        best = { category: rule.category, priority: rule.priority };
      }
    }

    return best?.category ?? SpendCategory.UNCATEGORIZED;
  }

  // Utility for arrays (Statements ingestion)
  applyToTransactions<T extends { description: string; spendCategory?: any }>(
    rows: T[],
  ): T[] {
    return rows.map((r) => {
      const current = (r as any).spendCategory;
      const shouldSet =
        !current || String(current) === SpendCategory.UNCATEGORIZED;

      if (!shouldSet) return r;

      const cat = this.categorize({ description: r.description });
      return { ...r, spendCategory: cat };
    });
  }
}