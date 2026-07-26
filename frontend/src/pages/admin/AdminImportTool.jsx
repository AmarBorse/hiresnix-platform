import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

const DOMAIN_COLORS = {
  "App Development":         { h: "#1e3a5f", r: "#dbeafe" },
  "Artificial Intelligence": { h: "#4c1d95", r: "#ede9fe" },
  "Data Science":            { h: "#065f46", r: "#d1fae5" },
  "Front End Developer":     { h: "#7c2d12", r: "#fef3c7" },
  "Full Stack Development":  { h: "#1e3a5f", r: "#dbeafe" },
  "Machine Learning":        { h: "#831843", r: "#fce7f3" },
  "DevOps":                  { h: "#1e3a5f", r: "#e0f2fe" },
  "Cybersecurity":           { h: "#7f1d1d", r: "#fee2e2" },
  "Android Development":     { h: "#14532d", r: "#dcfce7" },
  "UI/UX Design":            { h: "#581c87", r: "#f3e8ff" },
};

const OUTPUT_COLUMNS = ["Name", "Email", "Mobile", "Department", "Roll No", "Year"];

// Try to map any column name to our standard
function mapRow(r) {
  const get = (...keys) => {
    for (const k of keys) {
      if (r[k] !== undefined && r[k] !== null && r[k] !== "") return String(r[k]).trim();
    }
    return "";
  };
  return {
    Name:       get("Full Name", "Name", "name", "Student Name", "FULL NAME", "Student", "full_name"),
    Email:      get("Email", "email", "EMAIL", "Email ID", "email_id"),
    Mobile:     get("Mobile", "mobile", "Phone", "phone", "Contact", "Mobile No", "Phone No", "Mobile Number"),
    Department: get("Department", "department", "Dept", "Branch", "branch", "DEPARTMENT", "Course"),
    "Roll No":  get("Roll No", "Roll Number", "rollNumber", "Roll no", "ROLL NO", "Enrollment No", "Enrollment"),
    Year:       get("Year", "year", "YEAR", "Semester", "Sem"),
    _domainCol: get("Domain", "domain", "DOMAIN", "Internship Domain", "Stream", "Specialization", "Course Domain"),
  };
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // Detect title rows
        const firstCell = ws["A1"]?.v || "";
        const hasTitle = typeof firstCell === "string" &&
          (firstCell.includes("Student") || firstCell.includes("List") ||
           firstCell.includes("Hiresnix") || firstCell.includes("Domain") ||
           firstCell.includes("Total"));
        const rows = XLSX.utils.sheet_to_json(ws, hasTitle ? { range: 2 } : {});
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

function downloadDomainFile(domain, students) {
  const wb = XLSX.utils.book_new();
  // Header row + data rows
  const wsData = [
    OUTPUT_COLUMNS,
    ...students.map(s => OUTPUT_COLUMNS.map(c => s[c] || ""))
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  // Column widths
  ws["!cols"] = [{ wch: 30 }, { wch: 35 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, ws, domain.substring(0, 31));
  XLSX.writeFile(wb, `${domain.replace(/[^a-zA-Z0-9]/g, "_")}_Import.xlsx`);
}

function downloadAll(domainGroups) {
  const wb = XLSX.utils.book_new();
  for (const [domain, students] of Object.entries(domainGroups)) {
    if (!students.length) continue;
    const wsData = [
      OUTPUT_COLUMNS,
      ...students.map(s => OUTPUT_COLUMNS.map(c => s[c] || ""))
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 30 }, { wch: 35 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, domain.substring(0, 31));
  }
  XLSX.writeFile(wb, "Hiresnix_All_Domains_Import.xlsx");
}

export function AdminImportTool() {
  const [files, setFiles] = useState([]);
  const [processed, setProcessed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [domainMap, setDomainMap] = useState({});
  const [expandedDomain, setExpandedDomain] = useState(null);
  const fileRef = useRef();

  const handleFiles = useCallback(async (newFiles) => {
    setLoading(true);
    setError("");
    setProcessed(null);

    const allDomainGroups = {};
    const allStudents = [];

    for (const file of newFiles) {
      try {
        const rows = await readFile(file);
        // Detect domain from filename
        const fname = file.name.replace(/\.[^.]+$/, "").replace(/_Import|_import/g, "");
        const detectedDomain = Object.keys(DOMAIN_COLORS).find(d =>
          fname.toLowerCase().includes(d.toLowerCase().replace(/ /g, "_")) ||
          fname.toLowerCase().includes(d.toLowerCase().replace(/ /g, ""))
        ) || fname.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

        for (const row of rows) {
          const mapped = mapRow(row);
          if (!mapped.Name || !mapped.Email) continue;
          // Priority: 1) Domain column in data, 2) Manual override, 3) Filename detection
          const domain = mapped._domainCol || domainMap[file.name] || detectedDomain;
          const cleanDomain = domain || "Uncategorized";
          if (!allDomainGroups[cleanDomain]) allDomainGroups[cleanDomain] = [];
          const { _domainCol, ...cleanMapped } = mapped;
          allDomainGroups[cleanDomain].push(cleanMapped);
          allStudents.push({ ...cleanMapped, _domain: cleanDomain, _file: file.name });
        }
      } catch (e) {
        setError(`Error reading ${file.name}: ${e.message}`);
      }
    }

    setProcessed({ domainGroups: allDomainGroups, total: allStudents.length, allStudents });
    setLoading(false);
  }, [domainMap]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv")
    );
    setFiles(dropped);
    handleFiles(dropped);
  }, [handleFiles]);

  const onFileChange = useCallback((e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    handleFiles(selected);
  }, [handleFiles]);

  const totalStudents = processed ? Object.values(processed.domainGroups).reduce((a, b) => a + b.length, 0) : 0;
  const domains = processed ? Object.keys(processed.domainGroups) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#060d1f", fontFamily: "'Inter', sans-serif", color: "#e2e8f0", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#6366f1", fontWeight: 700, marginBottom: "0.5rem" }}>HIRESNIX TOOLS</div>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, margin: 0, color: "#fff" }}>Excel Import Converter</h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Upload any Excel/CSV → Auto-detects domain → Gives import-ready files
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed rgba(99,102,241,0.4)",
            borderRadius: 16, padding: "3rem 2rem",
            textAlign: "center", cursor: "pointer",
            background: "rgba(99,102,241,0.04)",
            transition: "all 0.2s",
            marginBottom: "1.5rem",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"}
        >
          <input ref={fileRef} type="file" multiple accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={onFileChange} />
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📂</div>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
            Drop Excel/CSV files here or click to browse
          </p>
          <p style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.4rem" }}>
            Supports .xlsx, .xls, .csv · Multiple files at once · Any column format
          </p>
          {files.length > 0 && (
            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center" }}>
              {files.map((f, i) => (
                <span key={i} style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 6, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
                  📄 {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Column mapping info */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.78rem", color: "#475569" }}>
          <span style={{ color: "#6366f1", fontWeight: 700 }}>Auto-maps:</span> Full Name / Name → <b>Name</b> · Email → <b>Email</b> · Mobile/Phone → <b>Mobile</b> · Department/Branch → <b>Department</b> · Roll No/Number → <b>Roll No</b> · Year/Semester → <b>Year</b>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ color: "#64748b" }}>Processing files...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "0.8rem 1rem", marginBottom: "1rem", color: "#f87171", fontSize: "0.85rem" }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {processed && !loading && (
          <div>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                { label: "Total Students", value: totalStudents, color: "#6366f1" },
                { label: "Domains Found", value: domains.length, color: "#10b981" },
                { label: "Files Processed", value: files.length, color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Download All */}
            {totalStudents > 0 && (
              <button
                onClick={() => downloadAll(processed.domainGroups)}
                style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "#fff", padding: "0.9rem", borderRadius: 12, fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", marginBottom: "1.25rem", letterSpacing: "0.02em" }}
              >
                ⬇ Download All Domains (One File)
              </button>
            )}

            {/* Domain Cards */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {domains.map(domain => {
                const students = processed.domainGroups[domain];
                const dc = DOMAIN_COLORS[domain] || { h: "#1e3a5f", r: "#dbeafe" };
                const expanded = expandedDomain === domain;
                return (
                  <div key={domain} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
                    {/* Domain Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1.1rem", cursor: "pointer" }}
                      onClick={() => setExpandedDomain(expanded ? null : domain)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: dc.h }} />
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{domain}</span>
                        <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                          {students.length} students
                        </span>
                      </div>
                      <div style={{ display: "flex", items: "center", gap: "0.5rem" }}>
                        <button
                          onClick={e => { e.stopPropagation(); downloadDomainFile(domain, students); }}
                          style={{ background: dc.h, border: "none", color: "#fff", padding: "5px 12px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          ⬇ Download
                        </button>
                        <span style={{ color: "#475569", fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {/* Student Preview */}
                    {expanded && (
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        {/* Column headers */}
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 2.5fr 1.2fr 1.5fr 1fr 0.7fr", gap: "0.5rem", padding: "0.5rem 1.1rem", background: "rgba(255,255,255,0.03)", fontSize: "0.65rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {OUTPUT_COLUMNS.map(c => <div key={c}>{c}</div>)}
                        </div>
                        {students.map((s, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2.5fr 1.2fr 1.5fr 1fr 0.7fr", gap: "0.5rem", padding: "0.4rem 1.1rem", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: "0.75rem", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                            <div style={{ color: "#e2e8f0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.Name || "—"}</div>
                            <div style={{ color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.Email || "—"}</div>
                            <div style={{ color: "#64748b" }}>{s.Mobile || "—"}</div>
                            <div style={{ color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.Department || "—"}</div>
                            <div style={{ color: "#64748b" }}>{s["Roll No"] || "—"}</div>
                            <div style={{ color: "#64748b" }}>{s.Year || "—"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalStudents === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "#475569" }}>
                <div style={{ fontSize: "2rem" }}>⚠️</div>
                <p>No valid students found. Make sure files have Name and Email columns.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
