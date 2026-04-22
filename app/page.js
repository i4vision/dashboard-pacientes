"use client";

import { useEffect, useState } from "react";

function formatPhone(phoneNum) {
  if (!phoneNum) return "";
  const cleaned = ('' + phoneNum).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]} ${match[3]}`;
  }
  return phoneNum.toString();
}

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString; 
  
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${dd}-${mm} ${hh}:${min} hs`;
}

export default function Home() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state for toggling expanding transcripts
  const [expandedTranscripts, setExpandedTranscripts] = useState({});

  const toggleTranscript = (id) => {
    setExpandedTranscripts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

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
    // Auto-refresh interval (every 10 seconds to catch webhook updates dynamically)
    const interval = setInterval(fetchPatients, 10000);
    return () => clearInterval(interval);
  }, []);

  const deletePatient = async (id) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatients(patients.filter(p => p.id !== id));
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while deleting');
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
    Confused: patients.filter(p => p.sentiment === "Confused").length,
    Frustrated: patients.filter(p => p.sentiment === "Frustrated").length,
    Delighted: patients.filter(p => p.sentiment === "Delighted").length,
    Neutral: patients.filter(p => p.sentiment === "Neutral").length,
    Angry: patients.filter(p => p.sentiment === "Angry").length,
  };

  return (
    <main className="container">
      {/* Global Dashboard Header */}
      <div className="metrics-header">
        <h1>Emotions Dashboard</h1>
        <p className="subtitle">
          Dynamic overview of caller sentiment explicitly categorized by AI analysis. 
          <span className="metadata-tag">Total Calls Analyzed: {totalCalls}</span>
          <span className="metadata-tag">Average Duration: {avgDuration}s</span>
        </p>
      </div>

      {/* Sentiment Grid Layout matching the Screenshot */}
      <div className="sentiment-grid">
        {/* Satisfied */}
        <div className="sentiment-card satisfied">
          <div className="icon-container">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="data-container">
            <span className="label">Satisfied</span>
            <span className="count">{sentimentCounts.Satisfied}</span>
          </div>
        </div>

        {/* Confused */}
        <div className="sentiment-card confused">
          <div className="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div className="data-container">
            <span className="label">Confused</span>
            <span className="count">{sentimentCounts.Confused}</span>
          </div>
        </div>

        {/* Frustrated */}
        <div className="sentiment-card frustrated">
          <div className="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div className="data-container">
            <span className="label">Frustrated</span>
            <span className="count">{sentimentCounts.Frustrated}</span>
          </div>
        </div>

        {/* Delighted */}
        <div className="sentiment-card delighted">
          <div className="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
          </div>
          <div className="data-container">
            <span className="label">Delighted</span>
            <span className="count">{sentimentCounts.Delighted}</span>
          </div>
        </div>

        {/* Neutral */}
        <div className="sentiment-card neutral">
          <div className="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
          </div>
          <div className="data-container">
            <span className="label">Neutral</span>
            <span className="count">{sentimentCounts.Neutral}</span>
          </div>
        </div>

        {/* Angry */}
        <div className="sentiment-card angry">
          <div className="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 15s1.5-2 4-2 4 2 4 2"></path><path d="M9 10l-1.5-1.5"></path><path d="M15 10l1.5-1.5"></path></svg>
          </div>
          <div className="data-container">
            <span className="label">Angry</span>
            <span className="count">{sentimentCounts.Angry}</span>
          </div>
        </div>
      </div>

      <div className="section-divider">
        <h2>Patient Directory</h2>
      </div>
      
      {/* Patient List */}
      {loading ? (
        <div className="skeleton-container">Loading patient records...</div>
      ) : error ? (
        <div className="error-alert">{error}</div>
      ) : patients.length === 0 ? (
        <div className="empty-state">No patients connected yet. Waiting for incoming records.</div>
      ) : (
        <div className="patient-list">
          {patients.map((patient) => {
             const hasCall = patient.vapi_call_id;
             let sentimentClass = "sentiment-tag neutral-bg";
             if (patient.sentiment === 'Satisfied' || patient.sentiment === 'Delighted') sentimentClass = "sentiment-tag positive-bg";
             if (patient.sentiment === 'Confused') sentimentClass = "sentiment-tag info-bg";
             if (patient.sentiment === 'Frustrated' || patient.sentiment === 'Angry') sentimentClass = "sentiment-tag negative-bg";

             return (
              <div className="patient-card" key={patient.id}>
                <table className="layout-table">
                  <tbody>
                    <tr className="header-row">
                      <th>Paciente</th>
                      <th>Género</th>
                      <th>Documento</th>
                      <th>Teléfono</th>
                      <th style={{ textAlign: "center" }}>Accion</th>
                    </tr>
                    <tr className="value-row">
                      <td><span className="value-link">{patient.nombres} {patient.apellidos}</span></td>
                      <td><span className="value-link">{patient.genero}</span></td>
                      <td><span className="value-link">{patient.documento}</span></td>
                      <td><span className="value-link">{formatPhone(patient.telefono)}</span></td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => deletePatient(patient.id)} className="delete-btn" title="Delete patient">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </td>
                    </tr>

                    <tr className="header-row">
                      <th>Especialidad</th>
                      <th>Tipo de Cita</th>
                      <th>Especialista</th>
                      <th colSpan="2" className="empty-cell"></th>
                    </tr>
                    <tr className="value-row">
                      <td><span className="value-link">{patient.especialidad}</span></td>
                      <td><span className="value-link">{patient.cita_tipo}</span></td>
                      <td><span className="value-link">{patient.especialista}</span></td>
                      <td colSpan="2" className="empty-cell"></td>
                    </tr>

                    <tr className="header-row">
                      <th>Fecha</th>
                      <th>Clínica</th>
                      <th>Entidad</th>
                      <th colSpan="2" className="empty-cell"></th>
                    </tr>
                    <tr className="value-row">
                      <td><span className="value-link">{formatDate(patient.fecha)}</span></td>
                      <td><span className="value-link">{patient.clinica}</span></td>
                      <td><span className="value-link">{patient.entidad}</span></td>
                      <td colSpan="2" className="empty-cell"></td>
                    </tr>
                    
                    {/* Call Analysis Data */}
                    {hasCall && (
                      <>
                        <tr className="header-row call-row-header">
                          <th colSpan="5">AI Telemetry & Analysis</th>
                        </tr>
                        <tr className="value-row call-data-row">
                          <td colSpan="5">
                             <div className="call-metrics-bar">
                                <span className={sentimentClass}>{patient.sentiment || "Analyzing..."}</span>
                                <span className="duration-tag">Duration: {patient.call_duration || 0}s</span>
                                <span className="call-id-tag">Call ID: {patient.vapi_call_id}</span>
                                
                                <button className="transcript-toggle" onClick={() => toggleTranscript(patient.id)}>
                                  {expandedTranscripts[patient.id] ? "Hide Transcript" : "Read Transcript"}
                                </button>
                             </div>
                             
                             {expandedTranscripts[patient.id] && (
                               <div className="transcript-box">
                                 {patient.transcript ? patient.transcript : "No transcript logged yet. Hang tight if the call just ended."}
                               </div>
                             )}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
             );
          })}
        </div>
      )}
    </main>
  );
}
