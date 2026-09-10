import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiUrl } from "../utils/apiConfig";

export default function CaseDetail() {
  const { id } = useParams(); // this is a string, e.g. "123"
  const navigate = useNavigate();

  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCase() {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        setError("Please log in first.");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        let res = await fetch(apiUrl(`/api/cases/${id}/`), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Handle 401 by refreshing token
        if (res.status === 401) {
          const refreshRes = await fetch(apiUrl("/api/token/refresh/"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (!refreshRes.ok) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            navigate("/login");
            return;
          }

          const refreshData = await refreshRes.json();
          localStorage.setItem("accessToken", refreshData.access);
          if (refreshData.refresh) {
            localStorage.setItem("refreshToken", refreshData.refresh);
          }

          res = await fetch(apiUrl(`/api/cases/${id}/`), {
            headers: {
              Authorization: `Bearer ${refreshData.access}`,
            },
          });
        }

        if (!res.ok) {
          throw new Error(`Failed to load case (${res.status})`);
        }

        const data = await res.json();
        setCaseItem(data);
      } catch (e) {
        setError(e.message || "Could not load case");
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, [id, navigate]);

  if (loading) {
    return <p>Loading case...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!caseItem) {
    return <p>Case not found.</p>;
  }

  return (
    <div className="case-detail">
      <h1>{caseItem.title}</h1>
      <p><strong>Address:</strong> {caseItem.address}</p>
      <p><strong>Client:</strong> {caseItem.client}</p>
      <p><strong>Status:</strong> {caseItem.status}</p>
      {/* Add more fields as your API provides */}

      <button onClick={() => navigate("/cases")}>Back to cases</button>
    </div>
  );
}