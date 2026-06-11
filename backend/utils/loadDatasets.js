const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Resolve dataset folder (sibling of backend/ in the workspace root)
const DATA_DIR = path.join(__dirname, '../rules_dataset');

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Trim all keys and values
        const cleaned = {};
        for (const [k, v] of Object.entries(row)) {
          cleaned[k.trim()] = typeof v === 'string' ? v.trim() : v;
        }
        results.push(cleaned);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function loadAllDatasets() {
  const [dataset, descriptions, precautions, severity] = await Promise.all([
    readCSV(path.join(DATA_DIR, 'dataset.csv')),
    readCSV(path.join(DATA_DIR, 'symptom_Description.csv')),
    readCSV(path.join(DATA_DIR, 'symptom_precaution.csv')),
    readCSV(path.join(DATA_DIR, 'Symptom-severity.csv'))
  ]);

  // Build description lookup  { "fungal infection": "..." }
  const descMap = {};
  for (const row of descriptions) {
    if (row.Disease) descMap[row.Disease.toLowerCase()] = row.Description || '';
  }

  // Build precaution lookup  { "malaria": ["drink water", ...] }
  const precautionMap = {};
  for (const row of precautions) {
    if (!row.Disease) continue;
    const key = row.Disease.toLowerCase();
    const precs = Object.keys(row)
      .filter((k) => k.startsWith('Precaution'))
      .map((k) => row[k])
      .filter(Boolean);
    precautionMap[key] = precs;
  }

  // Build severity lookup  { "itching": 1, "skin_rash": 3 }
  const severityMap = {};
  for (const row of severity) {
    if (row.Symptom) severityMap[row.Symptom.toLowerCase()] = Number(row.weight) || 1;
  }

  // Build rule list  [{ disease, symptoms[], description, precautions[] }]
  const symptomCols = Object.keys(dataset[0] || {}).filter(
    (k) => k.toLowerCase().includes('symptom')
  );

  const ruleMap = {};
  for (const row of dataset) {
    const disease = row.Disease;
    if (!disease) continue;
    const symptoms = symptomCols
      .map((col) => (row[col] || '').toLowerCase().trim())
      .filter(Boolean);
    const key = disease.toLowerCase();
    if (!ruleMap[key]) {
      ruleMap[key] = {
        disease,
        symptoms: new Set(),
        description: descMap[key] || 'No description available.',
        precautions: precautionMap[key] || ['Consult a doctor for proper guidance.']
      };
    }
    symptoms.forEach((s) => ruleMap[key].symptoms.add(s));
  }

  const rules = Object.values(ruleMap).map((r) => ({
    ...r,
    symptoms: Array.from(r.symptoms)
  }));

  // Collect all unique symptom names for ML feature vector
  const allSymptoms = [...new Set(rules.flatMap((r) => r.symptoms))].sort();

  return { rules, descMap, precautionMap, severityMap, allSymptoms };
}

module.exports = { loadAllDatasets };
