import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './History.css';

export default function History() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState({});
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/history')
      .then((res) => setRecords(res.data.records || []))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    setDeleting(id);
    try {
      await api.delete(`/history/${id}`);
      setRecords((prev) => prev.filter((r) => r._id !== id));
      toast.success('Record deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', marginTop:'20vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="history-page fade-in">
      <div className="history-header">
        <h1>📋 Diagnosis History</h1>
        <p>{records.length} record{records.length !== 1 ? 's' : ''} found</p>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <span>🩺</span>
          <h3>No diagnoses yet</h3>
          <p>Your past diagnoses will appear here.</p>
        </div>
      ) : (
        <div className="records-list">
          {records.map((r) => (
            <div key={r._id} className="record-card">
              <div className="record-header" onClick={() => toggle(r._id)}>
                <div className="record-info">
                  <span className="record-disease">🩸 {r.topDiagnosis}</span>
                  <span className="record-date">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="record-actions">
                  <button
                    className="btn-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}
                    disabled={deleting === r._id}
                  >
                    {deleting === r._id ? '…' : '🗑️'}
                  </button>
                  <span className="expand-icon">{expanded[r._id] ? '▲' : '▼'}</span>
                </div>
              </div>

              <div className="record-symptoms">
                {r.symptoms.map((s) => (
                  <span key={s} className="sym-badge">{s.replace(/_/g, ' ')}</span>
                ))}
              </div>

              {expanded[r._id] && (
                <div className="record-details fade-in">
                  {r.ruleBasedResults?.length > 0 && (
                    <div>
                      <h4>🧠 Rule-Based Results</h4>
                      <table className="result-table">
                        <thead>
                          <tr><th>Disease</th><th>Match</th><th>Matched Symptoms</th></tr>
                        </thead>
                        <tbody>
                          {r.ruleBasedResults.map((res) => (
                            <tr key={res.disease}>
                              <td>{res.disease}</td>
                              <td><span className="badge-blue">{(res.score * 100).toFixed(0)}%</span></td>
                              <td className="small-text">{res.matchedSymptoms?.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {r.mlResults?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4>🤖 Confidence Results</h4>
                      <table className="result-table">
                        <thead>
                          <tr><th>Disease</th><th>Confidence</th></tr>
                        </thead>
                        <tbody>
                          {r.mlResults.map((res) => (
                            <tr key={res.disease}>
                              <td>{res.disease}</td>
                              <td><span className="badge-orange">{(res.confidence * 100).toFixed(1)}%</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
