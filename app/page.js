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

  return (
    <main className="container">
      <h1>Patient Overview</h1>
      
      <div className="dashboard-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Género</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Clínica</th>
                <th>Entidad</th>
                <th>Cita</th>
                <th>Tipo de Cita</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: "var(--text-muted)", padding: "4rem 2rem", fontSize: "0.9rem" }}>
                    Loading patient records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: "var(--warning-color)", padding: "4rem 2rem" }}>
                    {error}
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: "var(--text-muted)", padding: "4rem 2rem" }}>
                    No patients connected yet. Waiting for incoming records.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {patient.nombres} {patient.apellidos}
                        </div>
                    </td>
                    <td>
                      <span className={`badge ${patient.genero === 'Femenino' ? 'badge-femenino' : 'badge-masculino'}`}>
                        {patient.genero}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", opacity: 0.85, fontSize: "0.85rem" }}>
                      {patient.documento}
                    </td>
                    <td style={{ color: "var(--text-muted)", letterSpacing: "0.03em" }}>
                      {formatPhone(patient.telefono)}
                    </td>
                    <td>
                      <span className="clinic-pill">{patient.clinica}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{patient.entidad}</td>
                    <td>{patient.cita}</td>
                    <td>
                      <span className={`badge ${patient.cita_tipo === 'Especialista' ? 'badge-especialista' : 'badge-estudio'}`}>
                        {patient.cita_tipo}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
