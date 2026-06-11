import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell
} from 'recharts';
import api from '../api/axios';
import './Diagnose.css';

const RULE_COLORS  = ['#0078d7','#0056b3','#00897b','#1976d2','#7b1fa2'];
const ML_COLORS    = ['#e65100','#c62828','#6a1b9a'];

export default function Diagnose() {
  const [allSymptoms, setAllSymptoms]   = useState([]);
  const [selected, setSelected]         = useState([]);
  const [searchTerm, setSearchTerm]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [results, setResults]           = useState(null);
  const [expanded, setExpanded]         = useState({});
  const [listening, setListening]       = useState(false);

  // Load symptoms list for autocomplete
  useEffect(() => {
    api.get('/diagnosis/symptoms')
      .then((res) => setAllSymptoms(res.data.symptoms || []))
      .catch(() => toast.error('Could not load symptoms list'));
  }, []);

  const filtered = allSymptoms.filter(
    (s) => s.includes(searchTerm.toLowerCase()) && !selected.includes(s)
  );

  const addSymptom = (sym) => {
    setSelected((prev) => [...prev, sym]);
    setSearchTerm('');
  };

  const removeSymptom = (sym) => setSelected((prev) => prev.filter((s) => s !== sym));

  // Web Speech API
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Speech recognition not supported in this browser'); return; }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.toLowerCase();
      const spoken = text.split(/,| and | with | also /).map((s) => s.trim()).filter(Boolean);
      const matched = spoken.flatMap((word) =>
        allSymptoms.filter((sym) => sym.includes(word) && !selected.includes(sym))
      );
      if (matched.length) {
        setSelected((prev) => [...new Set([...prev, ...matched])]);
        toast.success(`Added: ${matched.join(', ')}`);
      } else {
        toast.info(`No symptoms matched: "${text}"`);
      }
    };
    rec.onerror = () => { setListening(false); toast.error('Voice recognition error'); };
    rec.start();
  };

  const handleDiagnose = async () => {
    if (selected.length === 0) { toast.warning('Please select at least one symptom'); return; }
    setLoading(true);
    setResults(null);
    try {
      const { data } = await api.post('/diagnosis/analyze', { symptoms: selected });
      setResults(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="diagnose-page fade-in">
      <div className="diagnose-header">
        <h1>🔬 AI Medical Diagnosis</h1>
        <p>Select your symptoms and our AI will analyse possible conditions</p>
      </div>

      {/* Symptom Input */}
      <div className="symptom-input-card">
        <div className="symptom-search-row">
          <div className="symptom-search">
            <input
              type="text"
              placeholder="🔍 Search symptoms (e.g. fever, headache)…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && filtered.length > 0 && (
              <ul className="symptom-dropdown">
                {filtered.slice(0, 10).map((s) => (
                  <li key={s} onClick={() => addSymptom(s)}>{s.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            className={`btn-voice ${listening ? 'listening' : ''}`}
            onClick={startListening}
            title="Speak symptoms"
          >
            {listening ? '🔴 Listening…' : '🎤 Voice'}
          </button>
        </div>

        {/* Selected tags */}
        {selected.length > 0 && (
          <div className="symptom-tags">
            {selected.map((s) => (
              <span key={s} className="symptom-tag">
                {s.replace(/_/g, ' ')}
                <button onClick={() => removeSymptom(s)}>×</button>
              </span>
            ))}
          </div>
        )}

        {selected.length === 0 && (
          <p className="no-symptom-hint">Start typing above or speak to add symptoms</p>
        )}

        <button
          className="btn-diagnose"
          onClick={handleDiagnose}
          disabled={loading || selected.length === 0}
        >
          {loading
            ? <><span className="spinner" style={{ width:20, height:20, borderWidth:3 }} /> Analysing…</>
            : '🔍 Diagnose Now'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="results-section fade-in">

          {/* Rule-based bar chart */}
          {results.ruleBasedResults?.length > 0 && (
            <div className="result-card">
              <h2>🧠 Rule-Based Analysis</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={results.ruleBasedResults.map((r) => ({
                  name: r.disease,
                  score: parseFloat((r.score * 100).toFixed(1))
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="score" radius={[6,6,0,0]}>
                    {results.ruleBasedResults.map((_, i) => (
                      <Cell key={i} fill={RULE_COLORS[i % RULE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="disease-list">
                {results.ruleBasedResults.map((r, i) => (
                  <div key={r.disease} className="disease-item">
                    <div
                      className="disease-header"
                      onClick={() => toggle(`rule-${i}`)}
                    >
                      <span className="disease-name">
                        🩸 {r.disease}
                      </span>
                      <span className="disease-score" style={{ background: RULE_COLORS[i % RULE_COLORS.length] }}>
                        {(r.score * 100).toFixed(0)}% match
                      </span>
                      <span>{expanded[`rule-${i}`] ? '▲' : '▼'}</span>
                    </div>

                    {expanded[`rule-${i}`] && (
                      <div className="disease-body fade-in">
                        <p><strong>📄 Description:</strong> {r.description}</p>
                        <p><strong>🧩 Matched symptoms:</strong> {r.matchedSymptoms.join(', ').replace(/_/g, ' ')}</p>
                        <div className="precautions">
                          <strong>💊 Precautions:</strong>
                          <ul>
                            {r.precautions.map((p, j) => <li key={j}>{p}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ML Results */}
          {results.mlResults?.length > 0 && (
            <div className="result-card">
              <div className="result-card-title-row">
                <h2>🤖 RandomForest ML Predictions</h2>
                {results.mlAvailable
                  ? <span className="ml-badge ml-live">✅ Real ML Model</span>
                  : <span className="ml-badge ml-fallback">⚠️ ML Offline — Weighted Fallback</span>
                }
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={results.mlResults.map((r) => ({
                  name: r.disease,
                  confidence: parseFloat((r.confidence * 100).toFixed(1))
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="confidence" radius={[6,6,0,0]}>
                    {results.mlResults.map((_, i) => (
                      <Cell key={i} fill={ML_COLORS[i % ML_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="disease-list">
                {results.mlResults.map((r, i) => (
                  <div key={r.disease} className="disease-item">
                    <div
                      className="disease-header"
                      onClick={() => toggle(`ml-${i}`)}
                    >
                      <span className="disease-name">🤖 {r.disease}</span>
                      <span className="disease-score" style={{ background: ML_COLORS[i % ML_COLORS.length] }}>
                        {(r.confidence * 100).toFixed(1)}% confidence
                      </span>
                      <span>{expanded[`ml-${i}`] ? '▲' : '▼'}</span>
                    </div>

                    {expanded[`ml-${i}`] && (
                      <div className="disease-body fade-in">
                        {r.description && (
                          <p><strong>📄 Description:</strong> {r.description}</p>
                        )}
                        {r.precautions?.length > 0 && (
                          <div className="precautions">
                            <strong>💊 Precautions:</strong>
                            <ul>
                              {r.precautions.map((p, j) => <li key={j}>{p}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.ruleBasedResults?.length === 0 && results.mlResults?.length === 0 && (
            <div className="no-results">
              ❗ No matching diseases found. Try different or more symptoms.
            </div>
          )}

          <p className="disclaimer">
            ⚠️ <strong>Disclaimer:</strong> This tool is for informational purposes only and does not
            replace professional medical advice. Always consult a qualified doctor.
          </p>
        </div>
      )}
    </div>
  );
}
