import httpClient from "./httpClient";

export async function getSummary(params) {
  const { start, end } = params || {};
  const res = await httpClient.get("/analytics/summary", {
    params: { start, end },
  });

  const data = res.data || {};
  return {
    totalIncome: data.totalIncome ?? "0.00",
    totalExpense: data.totalExpense ?? "0.00",
    net: data.net ?? "0.00",
  };
}

export async function getByCategory(params) {
  const { start, end } = params || {};
  const res = await httpClient.get("/analytics/by-category", {
    params: { start, end },
  });

  const data = res.data || {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function getTopMerchants(params) {
  const { start, end, limit = 10 } = params || {};
  const res = await httpClient.get("/analytics/top-merchants", {
    params: { start, end, limit },
  });

  const data = res.data || {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function getRecurring(params) {
  const { months = 6, end } = params || {};
  const res = await httpClient.get("/analytics/recurring", {
    params: { months, end },
  });

  const data = res.data || {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function getMonthly(params) {
  const { start, end, includeCategoryMonthly = false } = params || {};
  const res = await httpClient.get("/analytics/monthly", {
    params: { start, end, includeCategoryMonthly },
  });

  const data = res.data || {};
  return {
    monthly: Array.isArray(data.monthly) ? data.monthly : [],
    byCategoryMonthly: Array.isArray(data.byCategoryMonthly)
      ? data.byCategoryMonthly
      : [],
  };
}