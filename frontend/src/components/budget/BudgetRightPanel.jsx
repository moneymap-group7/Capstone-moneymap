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
          alerts.map((a, idx) => (
            <div key={idx} className="alertItem">
              <div className="alertTop">
                <div className="alertTitle">{a.title}</div>
                <div className="alertSeverity">{a.severity}</div>
              </div>
              <div className="alertDetail">{a.detail}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}