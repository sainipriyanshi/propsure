import "./App.css";
import Header from "./components/Header";
import CaseList from "./components/CaseList.jsx";
import UploadPanel from "./components/UploadPanel";

import { Routes, Route, Navigate } from "react-router-dom";
import CaseDetail from "./components/CaseDetail";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import { useEffect, useState } from "react";

function App() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    setLoading(true);
    setError("");

    const API_BASE = "https://propsure.onrender.com/api";
    fetch("${API_BASE}/cases/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(`${response.status}: ${JSON.stringify(data)}`);
        }

        return data;
      })
      .then((data) => {
        console.log("Cases from Django:", data);
        setCases(data); // <-- save cases
        setError(""); // <-- clear errors
      })
      .catch((error) => {
        console.error("Could not load cases:", error);
        setError(error.message); // <-- show error
      })
      .finally(() => {
        setLoading(false); // <-- loading finished
      });
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

          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to="/cases" replace />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
