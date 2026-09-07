const riskStyles = {
  low:    { label: "Low Risk",     className: "risk-low" },
  medium: { label: "Medium Risk",  className: "risk-medium" },
  high:   { label: "High Risk",    className: "risk-high" }
};

export default function RiskFlag({ riskLevel }) {
  const risk = riskStyles[riskLevel] || riskStyles.low;
  return <span className={`risk-flag ${risk.className}`}>{risk.label}</span>;
}