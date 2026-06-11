const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const { loadAllDatasets } = require('../utils/loadDatasets');
const { ruleBasedDiagnosis } = require('../utils/diagnose');
const DiagnosisHistory = require('../models/DiagnosisHistory');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

let cachedData = null;

async function getData() {
  if (!cachedData) cachedData = await loadAllDatasets();
  return cachedData;
}

// @route  GET /api/diagnosis/symptoms
// Returns full list of known symptoms for autocomplete (from ML service if available, else local)
router.get('/symptoms', async (req, res) => {
  try {
    // Try ML service first for the authoritative symptom list
    const mlRes = await axios.get(`${ML_SERVICE_URL}/symptoms`, { timeout: 3000 });
    return res.json({ success: true, symptoms: mlRes.data.symptoms });
  } catch {
    // Fallback to local CSV
    try {
      const { allSymptoms } = await getData();
      res.json({ success: true, symptoms: allSymptoms });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to load symptoms' });
    }
  }
});

// @route  POST /api/diagnosis/analyze
// Body: { symptoms: ["fever", "headache"] }
router.post('/analyze', protect, async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ success: false, message: 'Provide at least one symptom' });
  }

  try {
    const { rules } = await getData();

    // 1. Rule-based diagnosis (always runs locally)
    const ruleResults = ruleBasedDiagnosis(symptoms, rules, 5);

    // 2. RandomForest ML predictions from Python microservice
    let mlResults = [];
    let mlAvailable = false;

    try {
      const mlRes = await axios.post(
        `${ML_SERVICE_URL}/predict`,
        { symptoms },
        { timeout: 8000 }
      );
      mlResults    = mlRes.data.predictions.map((p) => ({
        disease:     p.disease,
        confidence:  p.confidence,
        description: p.description,
        precautions: p.precautions
      }));
      mlAvailable = true;
    } catch (mlErr) {
      console.warn('⚠️  ML service unavailable, skipping RF predictions:', mlErr.message);
    }

    // Save to history
    const history = await DiagnosisHistory.create({
      user: req.user._id,
      symptoms,
      ruleBasedResults: ruleResults,
      mlResults: mlResults.map((r) => ({ disease: r.disease, confidence: r.confidence })),
      topDiagnosis: ruleResults[0]?.disease || mlResults[0]?.disease || 'Unknown'
    });

    res.json({
      success: true,
      diagnosisId: history._id,
      symptoms,
      ruleBasedResults: ruleResults,
      mlResults,
      mlAvailable
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Diagnosis failed' });
  }
});

module.exports = router;
