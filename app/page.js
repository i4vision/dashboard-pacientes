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
  if (isNaN(date.getTime())) return isoString; // Fallback if not proper ISO
  
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

  const deletePatient = async (id) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatients(patients.filter(p => p.id !== id));
      } else {
        alert('Failed to delete patient');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while deleting');
    }
  };

  return (
    <main className="container">
      <h1>Patient Overview</h1>
      
      {loading ? (
        <div className="skeleton-container" style={{ textAlign: "center", color: "var(--text-muted)", padding: "4rem 2rem", fontSize: "0.9rem" }}>
          Loading patient records...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "var(--warning-color)", padding: "4rem 2rem" }}>
          {error}
        </div>
      ) : patients.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "4rem 2rem" }}>
          No patients connected yet. Waiting for incoming records.
        </div>
      ) : (
        <div className="patient-list">
          {patients.map((patient) => (
            <div className="patient-card" key={patient.id}>
              <table className="layout-table">
                <tbody>
                  {/* Row 1 Headers */}
                  <tr className="header-row">
                    <th>Paciente</th>
                    <th>Género</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th style={{ textAlign: "center" }}>Accion</th>
                  </tr>
                  {/* Row 1 Values */}
                  <tr className="value-row">
                    <td><span className="value-link">{patient.nombres} {patient.apellidos}</span></td>
                    <td><span className="value-link">{patient.genero}</span></td>
                    <td><span className="value-link">{patient.documento}</span></td>
                    <td><span className="value-link">{formatPhone(patient.telefono)}</span></td>
                    <td style={{ textAlign: "center" }}>
                      <button onClick={() => deletePatient(patient.id)} className="delete-btn" title="Delete patient">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </td>
                  </tr>

                  {/* Row 2 Headers */}
                  <tr className="header-row">
                    <th>Cita</th>
                    <th>Tipo de Cita</th>
                    <th>Especialista</th>
                    <th colSpan="2" className="empty-cell"></th>
                  </tr>
                  {/* Row 2 Values */}
                  <tr className="value-row">
                    <td><span className="value-link">{patient.cita}</span></td>
                    <td><span className="value-link">{patient.cita_tipo}</span></td>
                    <td><span className="value-link">{patient.especialista}</span></td>
                    <td colSpan="2" className="empty-cell"></td>
                  </tr>

                  {/* Row 3 Headers */}
                  <tr className="header-row">
                    <th>Fecha</th>
                    <th>Clínica</th>
                    <th>Entidad</th>
                    <th colSpan="2" className="empty-cell"></th>
                  </tr>
                  {/* Row 3 Values */}
                  <tr className="value-row">
                    <td><span className="value-link">{formatDate(patient.fecha)}</span></td>
                    <td><span className="value-link">{patient.clinica}</span></td>
                    <td><span className="value-link">{patient.entidad}</span></td>
                    <td colSpan="2" className="empty-cell"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
