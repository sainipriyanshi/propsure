import "./App.css";
import Header from "./components/Header";
import CaseList from "./components/CaseList.jsx";
import UploadPanel from "./components/UploadPanel";

import { Routes, Route, Navigate } from "react-router-dom";
import CaseDetail from "./components/CaseDetail";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import { useEffect, useState } from "react";
import { getCases } from "./api/cases";

function App() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCases() {
      setLoading(true);
      setError("");

      try {
        const data = await getCases();

        if (!cancelled) {
          setCases(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Could not load cases:", err);
          setCases([]);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCases();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-container">
      <Header />
      <main className="page-layout">
        {loading && <p className="loading">Loading cases...</p>}
        {error && <p className="error">Could not load cases: {error}</p>}
        {!loading && !error && cases.length === 0 && (
          <p className="empty-state">No cases found. Create your first case.</p>
        )}

        <Routes>
          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <CaseList cases={cases} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cases/:id"
            element={
              <ProtectedRoute>
                <CaseDetail />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/cases" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
