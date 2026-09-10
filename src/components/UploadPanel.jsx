import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadPanel.css";
import { createCase } from "../api/cases";
import { uploadDocument, analyzeDocument } from "../api/documents";


const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

function getFileKey(file) {
  return `${file.name}-${file.size}`;
}

export default function UploadPanel() {
  const [caseTitle, setCaseTitle] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [caseClient, setCaseClient] = useState("");
  const [caseStatus, setCaseStatus] = useState("pending");
  const [caseRisk, setCaseRisk] = useState("low");

  const [caseMessage, setCaseMessage] = useState("");
  const [caseError, setCaseError] = useState("");
  const [createdCase, setCreatedCase] = useState(null);

  const navigate = useNavigate();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [previews, setPreviews] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  // New state for OCR/risk analysis response.
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [caseCreateError, setCaseCreateError] = useState("");

  useEffect(() => {
    const urls = Object.values(previews);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function filterAllowedFiles(fileList) {
    return Array.from(fileList).filter((file) => {
      const isAllowedType =
        ALLOWED_TYPES.includes(file.type) ||
        /\.(pdf|png|jpe?g)$/i.test(file.name);

      const isAllowedSize = file.size <= MAX_SIZE_MB * 1024 * 1024;

      return isAllowedType && isAllowedSize;
    });
  }

  function buildPreviews(files) {
    const previewMap = {};

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        previewMap[getFileKey(file)] = URL.createObjectURL(file);
      }
    });

    return previewMap;
  }

  function handleFileChange(event) {
    setUploadComplete(false);
    setAnalysisResult(null);
    setAnalysisError("");

    const allFiles = Array.from(event.target.files);
    const allowedFiles = filterAllowedFiles(allFiles);
    const rejected = allFiles.length - allowedFiles.length;

    setMessage(
      rejected > 0
        ? `${rejected} file(s) rejected (max 5MB, PDF/PNG/JPG).`
        : "",
    );

    setSelectedFiles(allowedFiles);
    setPreviews(buildPreviews(allowedFiles));

    // Clear an old analysis result when a user selects a new file.
    setAnalysisResult(null);
    setAnalysisError("");
  }

  function handleRemoveFile(fileToRemove) {
    const fileKey = getFileKey(fileToRemove);

    setSelectedFiles((previousFiles) =>
      previousFiles.filter((file) => file !== fileToRemove),
    );

    setPreviews((previousPreviews) => {
      const nextPreviews = { ...previousPreviews };

      if (nextPreviews[fileKey]) {
        URL.revokeObjectURL(nextPreviews[fileKey]);
        delete nextPreviews[fileKey];
      }

      return nextPreviews;
    });

    setAnalysisResult(null);
    setAnalysisError("");
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    setUploadComplete(false);
    setAnalysisResult(null);
    setAnalysisError("");

    event.preventDefault();
    setIsDragging(false);

    const allFiles = Array.from(event.dataTransfer.files);
    const allowedFiles = filterAllowedFiles(allFiles);
    const rejected = allFiles.length - allowedFiles.length;

    setMessage(
      rejected > 0
        ? `${rejected} file(s) rejected (max 5MB, PDF/PNG/JPG).`
        : "",
    );

    setSelectedFiles((previousFiles) => [...previousFiles, ...allowedFiles]);

    setPreviews((previousPreviews) => ({
      ...previousPreviews,
      ...buildPreviews(allowedFiles),
    }));

    setAnalysisResult(null);
    setAnalysisError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setCaseError("Please log in first.");
      setCaseMessage("");
      return;
    }

    try {
    const data = await createCase({
      title: caseTitle,
      address: caseDescription,
      client: caseClient,
      status: caseStatus,
      risk: caseRisk,
    });

    setCaseMessage("Case created successfully.");
    setCaseError("");
    setCreatedCase(data);

    console.log("Case created:", data);
  } catch (error) {
    console.error("Case creation failed:", error);
    setCaseError(`Case creation failed: ${error.message}`);
    setCaseMessage("");
  }
}


  async function handleDocumentUpload() {
    if (selectedFiles.length === 0) {
      setMessage("No files selected.");
      return;
    }

    if (!createdCase) {
      setMessage("Create a case first, then upload documents.");
      return;
    }

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setMessage("Please log in first.");
      return;
    }

    const formData = new FormData();

    formData.append("file", selectedFiles[0]);
    formData.append("case", createdCase.id);

    try {
    const data = await uploadDocument(formData);

    setMessage("Document uploaded successfully.");
    setUploadComplete(true);
  } catch (error) {
    setMessage(error.message || "Upload failed.");
  }
}


  async function handleAnalyze() {
    if (selectedFiles.length === 0) {
      setAnalysisError("Please select an image first.");
      return;
    }

    const selectedFile = selectedFiles[0];

    if (!selectedFile.type.startsWith("image/")) {
      setAnalysisError(
        "OCR analysis currently supports PNG and JPG images only. Please select an image instead of a PDF.",
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysisResult(null);

    const formData = new FormData();

    // "image" must match Django: request.FILES.get("image")
    formData.append("document", selectedFile);

     try {
    const data = await analyzeDocument(formData);

    setAnalysisResult(data);
    console.log("Analysis result:", data);
    setMessage("Document analysis complete.");
  } catch (error) {
    console.error("Analysis failed:", error);
    setAnalysisError(
      error.message || "Could not analyze the selected document.",
    );
  } finally {
    setIsAnalyzing(false);
  }
}


  function handleViewCases() {
    navigate("/cases");
  }


function guessOwnerFromOcr(ocrText) {
  const match = ocrText.match(/Owner:\s*(.+)/i);
  return match ? match[1].trim() : "";
}

function computeRiskLevel(risks) {
  if (!risks || risks.length === 0) return "low";
  const hasHigh = risks.some((r) => r.severity === "high");
  const hasMedium = risks.some((r) => r.severity === "medium");
  if (hasHigh) return "high";
  if (hasMedium) return "medium";
  return "low";
}

async function handleCreateCase(analysisResult, file) {
  setIsCreatingCase(true);
  setCaseCreateError("");

  const owner =
    analysisResult.extracted?.owner?.[0] ||
    guessOwnerFromOcr(analysisResult.ocr_text) ||
    "";

  const casePayload = {
    title: `Property - ${owner || "Unknown"}`,
    address: "", // you can add an input for this later
    client: client,
    risk: computeRiskLevel(analysisResult.risks),
  };

  try {
    // 1. Create the case
    const caseData = await createCase(casePayload);
    const caseId = caseData.id;

    // 2. Upload the document linked to this case
    const formData = new FormData();
    formData.append("case", caseId);
    formData.append("file", file);

    const docData = await uploadDocument(formData);

    console.log("Case created:", caseData);
    console.log("Document attached:", docData);
  } catch (error) {
    console.error("Create case or document failed:", error);
    setCaseCreateError(error.message || "Could not create case or attach document.");
  } finally {
    setIsCreatingCase(false);
  }
}


  return (
    <div
      className={isDragging ? "upload-panel dragging" : "upload-panel"}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <form onSubmit={handleSubmit} className="case-form">
        <h2>Create a case</h2>

        <input
          type="text"
          placeholder="Case title"
          value={caseTitle}
          onChange={(event) => setCaseTitle(event.target.value)}
          required
        />

        <textarea
          placeholder="Case address"
          value={caseDescription}
          onChange={(event) => setCaseDescription(event.target.value)}
          required
        />

        <input
          type="text"
          placeholder="client Name"
          value={caseClient}
          onChange={(event) => setCaseClient(event.target.value)}
          required
        />

        <select
          value={caseStatus}
          onChange={(event) => setCaseStatus(event.target.value)}
          required
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={caseRisk}
          onChange={(event) => setCaseRisk(event.target.value)}
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button type="submit" className="upload-button">
          Create case
        </button>

        {caseMessage && <p className="upload-message">{caseMessage}</p>}

        {caseError && <p className="upload-message">{caseError}</p>}
      </form>

      <label htmlFor="fileInput" className="upload-button">
        Click to select documents
      </label>

      <input
        id="fileInput"
        type="file"
        multiple
        hidden
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileChange}
      />

      {message && <p className="upload-message">{message}</p>}

      <p className="drag-hint">or drag and drop files here</p>

      <ul className="file-list">
        {selectedFiles.map((file) => (
          <li key={getFileKey(file)} className="file-item">
            {previews[getFileKey(file)] && (
              <img
                src={previews[getFileKey(file)]}
                alt={file.name || "Selected document preview"}
                className="file-thumb"
              />
            )}

            <span>
              {file.name || "Unnamed file"} — {(file.size / 1024).toFixed(1)} KB
            </span>

            <button
              type="button"
              className="remove-button"
              onClick={() => handleRemoveFile(file)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="upload-button"
        disabled={selectedFiles.length === 0}
        onClick={handleDocumentUpload}
      >
        Upload documents
      </button>

      <button
        type="button"
        className="upload-button"
        disabled={selectedFiles.length === 0 || isAnalyzing}
        onClick={handleAnalyze}
      >

        {isAnalyzing ? "Analyzing..." : "Analyze selected image"}
      </button>

      {analysisError && (
        <p className="upload-message">Analysis error: {analysisError}</p>
      )}

      {analysisResult && (
        <section className="analysis-result">
          <h3>Document analysis</h3>

          <div>
            <p>
              <strong>PAN found:</strong>{" "}
              {analysisResult.extracted?.pan?.length
                ? analysisResult.extracted.pan.join(", ")
                : "No valid PAN detected"}
            </p>

            <p>
              <strong>Risk status:</strong>{" "}
              {analysisResult.risks?.length
                ? `${analysisResult.risks.length} issue(s) found`
                : "No risks found"}
            </p>

            {analysisResult.risks?.length > 0 && (
              <ul className="risk-list">
                {analysisResult.risks.map((risk) => (
                  <li key={risk.rule}>
                    {risk.severity.toUpperCase()}: {risk.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <details>
            <summary>View OCR text</summary>
            <p className="display">
              {analysisResult.ocr_text || "No readable text detected."}
            </p>
          </details>
        </section>
      )}

      {analysisResult && (
  <>

    <button
      type="button"
      className="create-case-button"
      onClick={() => handleCreateCase(analysisResult, selectedFiles[0])}
      disabled={isCreatingCase}
    >
    
      {isCreatingCase ? "Creating case..." : "Create case from this document"}
    </button>

    {caseCreateError && (
      <p className="error-message">{caseCreateError}</p>
    )}
  </>
)}

      {uploadComplete ? (
        <div className="upload-success">
          <p>✓ Upload complete — your documents were added.</p>

          <button
            type="button"
            className="view-cases-button"
            onClick={handleViewCases}
          >
            View cases
          </button>
        </div>
      ) : (
        uploadProgress > 0 && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )
      )}
    </div>
  );
}
