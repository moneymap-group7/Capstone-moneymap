import { SpendCategory, TransactionType } from "@prisma/client";

export type CategorizeInput = {
  description: string;
  transactionType?: TransactionType | "DEBIT" | "CREDIT";
};

type Rule = {
  category: SpendCategory;
  // match if ANY pattern matches
  anyOf: (RegExp | string)[];
  // higher wins when multiple match
  priority: number;
};

function rx(s: string) {
  return new RegExp(s, "i");
}

// Keep this list small but credible for MVP.
// You can add more later without changing architecture.
export const AUTO_CATEGORIZE_RULES: Rule[] = [
  // INCOME (credit + payroll-like)
  {
    category: SpendCategory.INCOME,
    priority: 1000,
    anyOf: [
      rx("\\bpayroll\\b"),
      rx("\\bsalary\\b"),
      rx("\\bpay\\s?stub\\b"),
      rx("\\bdirect\\s?deposit\\b"),
      rx("\\bdeposit\\b"),
      rx("\\bemployer\\b"),
      rx("\\binterac\\s?etransfer\\b.*(received|deposit)"),
    ],
  },

  // TRANSFER / E-TRANSFER (often not "spending")
  {
    category: SpendCategory.TRANSFER,
    priority: 900,
    anyOf: [
      rx("\\betransfer\\b"),
      rx("\\be-?transfer\\b"),
      rx("\\binterac\\b"),
      rx("\\btransfer\\b"),
      rx("\\bpayment\\b.*(to|from)"),
    ],
  },

  // GROCERIES
  {
    category: SpendCategory.GROCERIES,
    priority: 800,
    anyOf: [
      "WALMART",
      "COSTCO",
      "NO FRILLS",
      "LOBLAWS",
      "METRO",
      "FRESHCO",
      "SUPERSTORE",
      "SOBEYS",
      "SAFEWAY",
      "WHOLE FOODS",
      "ZEHRS",
      "INDIA FOOD AND GROCERY",
      "KWC INDIAN GROCERY",
      "FARAH MARKET",
    ],
  },

  // FOOD AND DINING
  {
    category: SpendCategory.FOOD_AND_DINING,
    priority: 750,
    anyOf: [
      "TIM HORTONS",
      "STARBUCKS",
      "MCDONALD",
      "SUBWAY",
      "PIZZA",
      "BURGER",
      "RESTAURANT",
      "CAFE",
      "DOORDASH",
      "UBER EATS",
      "SKIPTHEDISHES",
      "CHERRY",
      "GINO",
      "UBEREATS",
      "SOBO",
    ],
  },

  // TRANSPORTATION
  {
    category: SpendCategory.TRANSPORTATION,
    priority: 700,
    anyOf: [
      rx("^uber\\b"),
      rx("\\blyft\\b"),
      rx("\\bpresto\\b"),
      rx("\\bgas\\b"),
      "SHELL",
      "ESSO",
      "PETRO",
      "HUSKY",
    ],
  },

  // ENTERTAINMENT
  {
    category: SpendCategory.ENTERTAINMENT,
    priority: 650,
    anyOf: ["NETFLIX", "SPOTIFY", "DISNEY", "PRIME VIDEO", "APPLE.COM/BILL",  "OPENAI", "CHATGPT"],
  },

  // SHOPPING
  {
    category: SpendCategory.SHOPPING,
    priority: 600,
    anyOf: ["AMAZON", "BEST BUY", "WAL-MART", "EBAY", "IKEA", "CANADIAN TIRE", "URBAN BEHAVIOR"],
  },

  // UTILITIES
  {
    category: SpendCategory.UTILITIES,
    priority: 550,
    anyOf: [
        "HYDRO",
        "ELECTRIC",
        "GAS BILL",
        rx("\\bWATER\\b"),
        "ROGERS",
        "BELL",
        "TELUS",
    ],
  },

  // FEES
  {
    category: SpendCategory.FEES,
    priority: 500,
    anyOf: [
      rx("\\bfee\\b"),
      rx("\\bservice\\s?charge\\b"),
      rx("\\bnsf\\b"),
      "PURCHASE INTEREST",
    ],
  },
];