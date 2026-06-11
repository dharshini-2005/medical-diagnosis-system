const mongoose = require('mongoose');

const diagnosisResultSchema = new mongoose.Schema({
  disease: { type: String, required: true },
  score: { type: Number, required: true },        // rule-based match score 0-1
  description: { type: String },
  precautions: [{ type: String }],
  matchedSymptoms: [{ type: String }]
});

const diagnosisHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    symptoms: [{ type: String, required: true }],
    ruleBasedResults: [diagnosisResultSchema],
    mlResults: [
      {
        disease: { type: String },
        confidence: { type: Number }
      }
    ],
    topDiagnosis: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DiagnosisHistory', diagnosisHistorySchema);
