const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { generateAppointmentId, TIME_SLOTS } = require('../utils/helpers');
const { validateEmail, validatePhone, validateFutureDate, sanitizeString } = require('../utils/validators');

exports.getAppointments = async (req, res) => {
  try {
    const { status, search, date } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: start, $lte: end };
    }

    let appointments = await Appointment.find(filter)
      .populate('patientId', 'fullName phone email age gender')
      .sort({ appointmentDate: -1, appointmentTime: 1 });

    if (search) {
      const term = search.toLowerCase();
      appointments = appointments.filter(
        (a) =>
          a.appointmentId.toLowerCase().includes(term) ||
          a.service.toLowerCase().includes(term) ||
          (a.patientId && a.patientId.fullName.toLowerCase().includes(term))
      );
    }

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
  }
};

exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      'patientId',
      'fullName phone email age gender'
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch appointment.' });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { fullName, phone, email, age, gender, service, appointmentDate, appointmentTime, notes } = req.body;

    if (!fullName || !phone || !email || !age || !gender || !service || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
    }

    if (!validateFutureDate(appointmentDate)) {
      return res.status(400).json({ success: false, message: 'Appointment date must be today or in the future.' });
    }

    if (!TIME_SLOTS.includes(appointmentTime)) {
      return res.status(400).json({ success: false, message: 'Invalid time slot selected.' });
    }

    const dateStart = new Date(appointmentDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(appointmentDate);
    dateEnd.setHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({
      appointmentDate: { $gte: dateStart, $lte: dateEnd },
      appointmentTime,
      status: { $nin: ['Cancelled'] },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked. Please choose another.' });
    }

    let patient = await Patient.findOne({ email: email.toLowerCase() });

    if (patient) {
      patient.fullName = sanitizeString(fullName);
      patient.phone = sanitizeString(phone);
      patient.age = Number(age);
      patient.gender = gender;
      await patient.save();
    } else {
      patient = await Patient.create({
        fullName: sanitizeString(fullName),
        phone: sanitizeString(phone),
        email: email.toLowerCase(),
        age: Number(age),
        gender,
      });
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      service: sanitizeString(service),
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      notes: notes ? sanitizeString(notes) : '',
      status: 'Pending',
      appointmentId: generateAppointmentId(),
    });

    await appointment.populate('patientId', 'fullName phone email age gender');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate appointment detected.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create appointment.' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { status, appointmentDate, appointmentTime, notes, service } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (status) {
      const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status.' });
      }
      appointment.status = status;
    }

    if (appointmentDate) {
      if (!validateFutureDate(appointmentDate) && status !== 'Completed' && status !== 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Appointment date must be valid.' });
      }
      appointment.appointmentDate = new Date(appointmentDate);
    }

    if (appointmentTime) {
      if (!TIME_SLOTS.includes(appointmentTime)) {
        return res.status(400).json({ success: false, message: 'Invalid time slot.' });
      }

      const checkDate = appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate;
      const dateStart = new Date(checkDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(checkDate);
      dateEnd.setHours(23, 59, 59, 999);

      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        appointmentDate: { $gte: dateStart, $lte: dateEnd },
        appointmentTime,
        status: { $nin: ['Cancelled'] },
      });

      if (conflict) {
        return res.status(409).json({ success: false, message: 'Time slot already booked.' });
      }

      appointment.appointmentTime = appointmentTime;
    }

    if (notes !== undefined) appointment.notes = sanitizeString(notes);
    if (service) appointment.service = sanitizeString(service);

    await appointment.save();
    await appointment.populate('patientId', 'fullName phone email age gender');

    res.status(200).json({ success: true, message: 'Appointment updated.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update appointment.' });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    res.status(200).json({ success: true, message: 'Appointment deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete appointment.' });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required.' });
    }

    if (!validateFutureDate(date)) {
      return res.status(400).json({ success: false, message: 'Date must be today or in the future.' });
    }

    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      appointmentDate: { $gte: dateStart, $lte: dateEnd },
      status: { $nin: ['Cancelled'] },
    }).select('appointmentTime');

    const bookedTimes = booked.map((b) => b.appointmentTime);
    const available = TIME_SLOTS.filter((slot) => !bookedTimes.includes(slot));

    res.status(200).json({ success: true, date, available, allSlots: TIME_SLOTS });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch available slots.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients, totalAppointments, todayAppointments, completed, pending] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow }, status: { $ne: 'Cancelled' } }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Pending' }),
    ]);

    const statusBreakdown = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const monthlyData = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalAppointments,
        todayAppointments,
        completedTreatments: completed,
        pendingAppointments: pending,
        statusBreakdown,
        monthlyData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
  }
};
