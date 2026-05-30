const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { validateEmail, validatePhone, sanitizeString } = require('../utils/validators');

exports.getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      filter = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const patients = await Patient.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch patients.' });
  }
};

exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const appointments = await Appointment.find({ patientId: patient._id }).sort({ appointmentDate: -1 });

    res.status(200).json({ success: true, data: { patient, appointments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch patient.' });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const { fullName, phone, email, age, gender } = req.body;

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number.' });
    }

    if (fullName) patient.fullName = sanitizeString(fullName);
    if (phone) patient.phone = sanitizeString(phone);
    if (email) patient.email = email.toLowerCase();
    if (age) patient.age = Number(age);
    if (gender) patient.gender = gender;

    await patient.save();

    res.status(200).json({ success: true, message: 'Patient updated.', data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update patient.' });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    await Appointment.deleteMany({ patientId: patient._id });

    res.status(200).json({ success: true, message: 'Patient and related appointments deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete patient.' });
  }
};
