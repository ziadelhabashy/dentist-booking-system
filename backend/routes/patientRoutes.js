const express = require('express');
const { getPatients, getPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getPatients);
router.get('/:id', getPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

module.exports = router;
