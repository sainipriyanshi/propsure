import CaseCard from "./CaseCard";
import { useEffect, useState } from "react";
import { apiUrl } from "../utils/apiConfig";
import { refreshAccessToken } from "../api/auth";

export default function CaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState("");

  function handleRetry() {
    setRetryCount((c) => c + 1);
  }

  const filteredCases = cases.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.client && c.client.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    async function loadCases() {
      const refreshToken = localStorage.getItem("refreshToken");
      let accessToken = localStorage.getItem("accessToken");

      if (!refreshToken) {
        setError("Please log in first.");
        setLoading(false);
        return;
      }

      try {
        let response = await fetch(apiUrl("/api/cases/"), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          const refreshResponse = await fetch(apiUrl("/api/token/refresh/"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refresh: refreshToken,
            }),
          });

          const refreshData = await refreshAccessToken(refreshToken);
          accessToken = refreshData.access;

          localStorage.setItem("accessToken", accessToken);

          if (refreshData.refresh) {
            localStorage.setItem("refreshToken", refreshData.refresh);
          }
          response = await fetch(apiUrl("/api/cases/"), {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`${response.status}: ${JSON.stringify(data)}`);
        }

        setCases(data.results ?? data);
      } catch (requestError) {
        console.error("Could not load cases:", requestError);

        const msg = requestError.message || "Unknown error";

        if (msg.startsWith("401")) {
          setError("Your session expired. Please log in again.");
        } else if (/^5\d{2}$/.test(msg.split(":")[0])) {
          setError("Server error. Please try again later.");
        } else if (
          msg.includes("NetworkError") ||
          msg.includes("Failed to fetch") ||
          msg.includes("NetworkError") ||
          msg.includes("ERR_")
        ) {
          setError(
            "Cannot connect to the server. Please check your connection.",
          );
        } else {
          setError("Could not load cases. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, [retryCount]);

  if (loading) {
    return <p>Loading cases...</p>;
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  if (cases.length === 0) {
    return <p>No cases found.</p>;
  }

  return (
    <div className="case-page">
      {/* Search bar row */}
      <div className="case-search-row">
        <input
          type="text"
          className="case-search-input"
          placeholder="Search by title, address, or owner"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="case-list">
        {filteredCases.length === 0 ? (
          <p>No cases match your search.</p>
        ) : (
          filteredCases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseData={caseItem} /> //caseData={c} passes the entire case object as a single prop named caseData into CaseCard
          ))
        )}
      </div>
    </div>
  );
}
