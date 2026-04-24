"use client";

import { useEffect, useState } from "react";

function formatPhone(phoneNum) {
  if (!phoneNum) return "N/A";
  const cleaned = ('' + phoneNum).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]} ${match[3]}`;
  }
  return phoneNum.toString();
}

function formatDate(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString; 
  
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${dd}-${mm} ${hh}:${min} hs`;
}

// Reusable SVG for Delete
const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

export default function Home() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for opening the interactive Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState('All');

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('/api/patients');
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        } else {
          setError("Received error from API.");
        }
      } catch (err) {
        console.error("Failed to fetch", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  const deletePatient = async (id, e) => {
    e.stopPropagation(); // Prevents the Modal from firing when the delete button is clicked
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatients(patients.filter(p => p.id !== id));
        // Close modal just in case they manage to delete while it's somehow hydrating
        if (selectedPatient?.id === id) setSelectedPatient(null);
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while deleting');
    }
  };

  const getSentimentClass = (sentiment) => {
    if (sentiment === 'Satisfied') return "sentiment-badge positive-bg";
    if (sentiment === 'Frustrated' || sentiment === 'Angry') return "sentiment-badge negative-bg";
    return "sentiment-badge neutral-bg";
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'Satisfied': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', color: 'var(--sent-green)' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
      case 'Frustrated': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', color: 'var(--sent-yellow)' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
      case 'Angry': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', color: 'var(--sent-red)' }}><circle cx="12" cy="12" r="10"></circle><path d="M8 15s1.5-2 4-2 4 2 4 2"></path><path d="M9 10l-1.5-1.5"></path><path d="M15 10l1.5-1.5"></path></svg>;
      case 'Neutral': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', color: 'var(--sent-gray)' }}><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>;
      default: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
    }
  };

  // Pre-calculate Aggregates
  const totalCalls = patients.filter(p => p.vapi_call_id).length;
  const callsWithDuration = patients.filter(p => p.call_duration > 0);
  const avgDuration = callsWithDuration.length > 0 
    ? Math.round(callsWithDuration.reduce((acc, curr) => acc + curr.call_duration, 0) / callsWithDuration.length) 
    : 0;

  const sentimentCounts = {
    Satisfied: patients.filter(p => p.sentiment === "Satisfied").length,
    Frustrated: patients.filter(p => p.sentiment === "Frustrated").length,
    Neutral: patients.filter(p => p.sentiment === "Neutral").length,
    Angry: patients.filter(p => p.sentiment === "Angry").length,
  };

  const filteredPatients = sentimentFilter === 'All' 
    ? patients 
    : patients.filter(p => p.sentiment === sentimentFilter);

  return (
    <main className="container">
      {/* Global Dashboard Header & Hero Metrics */}
      <div className="dashboard-top-section">
        <div className="metrics-header">
          <h1>Katia Dashboard</h1>
          <p className="subtitle">Dynamic overview of caller sentiment explicitly categorized by AI analysis.</p>
        </div>
        
        <div className="hero-metrics-container">
           <div className="hero-metric-card">
              <span className="hero-label">Total Calls</span>
              <span className="hero-value">{totalCalls}</span>
           </div>
           <div className="hero-metric-card">
              <span className="hero-label">Avg Duration</span>
              <span className="hero-value">{avgDuration}s</span>
           </div>
        </div>
      </div>

      <button className="toggle-analytics-btn" onClick={() => setShowAnalytics(!showAnalytics)}>
         {showAnalytics ? "Hide Katia Sentiment Metrics" : "View Katia Sentiment Metrics"}
         <svg className={`toggle-icon ${showAnalytics ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {showAnalytics && (
        <div className="sentiment-grid">
          <div className="sentiment-card satisfied">
            <div className="icon-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
            <div className="data-container"><span className="label">Satisfied</span><span className="count">{sentimentCounts.Satisfied}</span></div>
          </div>
          <div className="sentiment-card frustrated">
            <div className="icon-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
            <div className="data-container"><span className="label">Frustrated</span><span className="count">{sentimentCounts.Frustrated}</span></div>
          </div>
          <div className="sentiment-card neutral">
            <div className="icon-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg></div>
            <div className="data-container"><span className="label">Neutral</span><span className="count">{sentimentCounts.Neutral}</span></div>
          </div>
          <div className="sentiment-card angry">
            <div className="icon-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 15s1.5-2 4-2 4 2 4 2"></path><path d="M9 10l-1.5-1.5"></path><path d="M15 10l1.5-1.5"></path></svg></div>
            <div className="data-container"><span className="label">Angry</span><span className="count">{sentimentCounts.Angry}</span></div>
          </div>
        </div>
      )}

      {/* Patient List Model */}
      {loading ? (
        <div className="skeleton-container">Loading records...</div>
      ) : error ? (
        <div className="error-alert">{error}</div>
      ) : patients.length === 0 ? (
        <div className="empty-state">No recent calls discovered.</div>
      ) : (
        <div className="interactive-list">
          {/* Header Layout With Filter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", padding: "0 0.5rem" }}>
             <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "white" }}>Recent Calls</h2>
             
             <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Filter Katia:</span>
                <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", padding: "0.25rem", borderRadius: "30px", border: "1px solid var(--border-color)" }}>
                   {['All', 'Satisfied', 'Frustrated', 'Neutral', 'Angry'].map(filter => (
                      <button 
                         key={filter}
                         onClick={() => setSentimentFilter(filter)}
                         style={{
                            padding: "0.4rem 1rem",
                            borderRadius: "30px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            transition: "all 0.2s",
                            background: sentimentFilter === filter ? "var(--accent-color)" : "transparent",
                            color: sentimentFilter === filter ? "white" : "var(--text-muted)",
                         }}
                      >
                         {filter === 'All' ? 'All Calls' : filter}
                      </button>
                   ))}
                </div>
             </div>
          </div>

          {/* Main Titles */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 100px auto', padding: '0.5rem 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
             <span>Paciente</span>
             <span>Especialidad</span>
             <span>Fecha</span>
             <span>Teléfono</span>
             <span style={{ textAlign: "center" }}>Katia</span>
             <span style={{ textAlign: "center", width: "40px" }}>Accion</span>
          </div>
          
          {filteredPatients.map((patient) => (
            <div 
               className="list-row" 
               key={patient.id} 
               onClick={() => setSelectedPatient(patient)}
            >
               <div className="list-col">
                  <span className="data-value" style={{ color: "white", fontWeight: 600, fontSize: "1.05rem" }}>
                    {patient.nombres} {patient.apellidos}
                  </span>
               </div>
               <div className="list-col">
                  <span className="data-value" style={{ color: "#c084fc", background: "rgba(192, 132, 252, 0.1)", padding: "0.3rem 0.6rem", borderRadius: "6px", display: "inline-block", width: "fit-content", fontWeight: 500 }}>
                    {patient.especialidad || "N/A"}
                  </span>
               </div>
               <div className="list-col">
                  <span className="data-value" style={{ color: "#34d399", fontWeight: 500 }}>
                    {formatDate(patient.fecha)}
                  </span>
               </div>
               <div className="list-col">
                  <span className="data-value" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    {formatPhone(patient.telefono)}
                  </span>
               </div>
               <div className="list-col" style={{ alignItems: "center", justifyContent: "center", paddingRight: 0 }} title={`Sentiment: ${patient.sentiment || 'Pending'}`}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getSentimentIcon(patient.sentiment)}
                  </span>
               </div>
               <div className="list-col" style={{ alignItems: "center", paddingRight: 0 }}>
                  <button className="delete-action-btn" onClick={(e) => deletePatient(patient.id, e)} title="Delete Record">
                     <TrashIcon />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Detailed Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
             <div className="modal-header">
                <div>
                   <span className="data-label">Paciente</span>
                   <h3>{selectedPatient.nombres} {selectedPatient.apellidos}</h3>
                </div>
                <button className="close-btn" onClick={() => setSelectedPatient(null)}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
             </div>
             
             <div className="modal-body">
                {/* Core Data */}
                <div className="data-grid">
                   <div className="metric">
                     <span className="data-label">Documento</span>
                     <span className="data-value">{selectedPatient.documento || "N/A"}</span>
                   </div>
                   <div className="metric">
                     <span className="data-label">Género</span>
                     <span className="data-value">{selectedPatient.genero || "N/A"}</span>
                   </div>
                   <div className="metric">
                     <span className="data-label">Teléfono</span>
                     <span className="data-value">{formatPhone(selectedPatient.telefono)}</span>
                   </div>
                </div>

                <div className="data-grid">
                   <div className="metric">
                     <span className="data-label">Especialidad</span>
                     <span className="data-value highlight">{selectedPatient.especialidad || "N/A"}</span>
                   </div>
                   <div className="metric">
                     <span className="data-label">Especialista</span>
                     <span className="data-value highlight">{selectedPatient.especialista || "N/A"}</span>
                   </div>
                   <div className="metric">
                     <span className="data-label">Tipo de Cita</span>
                     <span className="data-value highlight">{selectedPatient.cita_tipo || "N/A"}</span>
                   </div>
                   <div className="metric">
                     <span className="data-label">Clínica</span>
                     <span className="data-value highlight">{selectedPatient.clinica || "N/A"}</span>
                   </div>
                   <div className="metric">
                     <span className="data-label">Entidad</span>
                     <span className="data-value highlight">{selectedPatient.entidad || "N/A"}</span>
                   </div>
                </div>

                {/* AI Overlay Box */}
                {selectedPatient.vapi_call_id ? (
                  <>
                    <span className="data-label">Katia Telemetry Analytics</span>
                    <div className="ai-telemetry-block">
                       <div className="metric">
                         <span className="data-label">Katia Calculated Sentiment</span>
                         <span className={getSentimentClass(selectedPatient.sentiment)}>
                           {selectedPatient.sentiment || "Analyzing context..."}
                         </span>
                       </div>
                       <div className="metric">
                         <span className="data-label">Call Duration</span>
                         <span className="data-value">{selectedPatient.call_duration || "0"}s</span>
                       </div>
                       <div className="metric">
                         <span className="data-label">Routing Tag</span>
                         <span className="data-value" style={{ fontFamily: "monospace", opacity: 0.7 }}>{selectedPatient.vapi_call_id}</span>
                       </div>
                    </div>
                    
                    <div className="transcript-area">
                       <span className="data-label">Raw Phone Transcript</span>
                       <p>{(selectedPatient.transcript === null || selectedPatient.transcript === undefined) ? "Transcript processing in pipeline..." : selectedPatient.transcript}</p>
                    </div>
                    
                    {selectedPatient.recording_url && (
                       <div style={{ marginTop: "1rem", background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                          <span className="data-label">Call Audio Recording</span>
                          <audio controls src={selectedPatient.recording_url} style={{ width: "100%", marginTop: "0.5rem", outline: "none" }} />
                       </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state" style={{ padding: "2rem", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                     No automated call telemetry found for this patient payload.
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </main>
  );
}
