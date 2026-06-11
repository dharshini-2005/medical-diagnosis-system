const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const DiagnosisHistory = require('../models/DiagnosisHistory');

// @route  GET /api/history
// Returns all diagnosis records for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const records = await DiagnosisHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// @route  GET /api/history/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const record = await DiagnosisHistory.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch record' });
  }
});

// @route  DELETE /api/history/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await DiagnosisHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete record' });
  }
});

module.exports = router;
