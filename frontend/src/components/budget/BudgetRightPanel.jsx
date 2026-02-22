export default function BudgetRightPanel({ alerts = [] }) {
  return (
    <div className="card">
      <div className="cardHead">
        <h3 className="cardTitle">Alerts</h3>
        <p className="cardDesc">Triggered threshold rules.</p>
      </div>

      <div className="cardBody" style={{ display: "grid", gap: 12 }}>
        {alerts.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No alerts.</div>
        ) : (
          alerts
            .slice()
            .sort((a, b) => {
              const rank = { CRITICAL: 3, NEAR_LIMIT: 2, WARNING: 1 };
              return (rank[b?.severity] || 0) - (rank[a?.severity] || 0);
            })
            .map((a, idx) => (
              <div key={`${a.spendCategory}-${idx}`} className="alertItem">
                <div className="alertTop">
                  <div className="alertTitle">{a.spendCategory}</div>

                  <span className={`severityBadge sev-${String(a.severity || "").toLowerCase()}`}>
                    {a.severity}
                  </span>
                </div>

                <div className="alertDetail">{a.message}</div>

                <div className="alertMeta">
                  <span>{Number(a.currentPercent || 0).toFixed(2)}%</span>
                  <span>•</span>
                  <span>Limit: ${Number(a.budgetLimit || 0).toFixed(2)}</span>
                  <span>•</span>
                  <span>Spent: ${Number(a.currentSpend || 0).toFixed(2)}</span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}