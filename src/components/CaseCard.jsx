import StatusBadge from "./StatusBadge";
import RiskFlag from "./RiskFlag";
import { Link } from "react-router-dom";

export default function CaseCard({ caseData }) {
  const {id, title, address, client, status, risk, updated_at } = caseData;

  return (
    <Link to={`/cases/${id}`} className="card-link">
      <div className="case-card-box">
      <div className="case-card-header">
        <h3 className="case-title">{title || "Untitled case"}</h3>
        <span className={`status-badge status-${status?.toLowerCase()}`}>
          {status || "Unknown"}
        </span>
      </div>

      <div className="case-card-body">
        <p className="case-address">{address}</p>
        <p className="case-client">Client: {client}</p>
        {risk && <p className="case-risk">Risk: {risk}</p>}
        {updated_at && (
          <p className="case-updated">
            Updated: {new Date(updated_at).toLocaleString()}
          </p>
        )}
      </div>
      </div>
    </Link>
  );
}
