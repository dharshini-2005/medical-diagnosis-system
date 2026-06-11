/**
 * Rule-based diagnosis engine.
 * Returns top-N diseases sorted by match score.
 */
function ruleBasedDiagnosis(userSymptoms, rules, topN = 5) {
  const inputSet = new Set(userSymptoms.map((s) => s.toLowerCase().trim()));
  const results = [];

  for (const rule of rules) {
    const ruleSet = new Set(rule.symptoms);
    const matched = [...inputSet].filter((s) => ruleSet.has(s));
    if (matched.length === 0) continue;

    const score = matched.length / rule.symptoms.length;

    results.push({
      disease: rule.disease,
      score: parseFloat(score.toFixed(4)),
      description: rule.description,
      precautions: rule.precautions,
      matchedSymptoms: matched
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topN);
}

/**
 * Simple ML-like confidence using symptom severity weights.
 * Scores each disease by the sum of severity weights for matched symptoms
 * then normalises to probabilities.
 */
function weightedDiagnosis(userSymptoms, rules, severityMap, topN = 3) {
  const inputSet = new Set(userSymptoms.map((s) => s.toLowerCase().trim()));
  const scores = [];

  for (const rule of rules) {
    const ruleSet = new Set(rule.symptoms);
    let weight = 0;
    for (const sym of inputSet) {
      if (ruleSet.has(sym)) {
        weight += severityMap[sym] || 1;
      }
    }
    if (weight > 0) scores.push({ disease: rule.disease, weight });
  }

  const total = scores.reduce((s, r) => s + r.weight, 0) || 1;
  return scores
    .map((r) => ({ disease: r.disease, confidence: parseFloat((r.weight / total).toFixed(4)) }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topN);
}

module.exports = { ruleBasedDiagnosis, weightedDiagnosis };
