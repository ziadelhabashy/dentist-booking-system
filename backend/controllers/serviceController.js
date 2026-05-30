const Service = require('../models/Service');
const { sanitizeString } = require('../utils/validators');

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ title: 1 });
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch services.' });
  }
};

exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch service.' });
  }
};

exports.createService = async (req, res) => {
  try {
    const { title, description, duration, priceRange } = req.body;

    if (!title || !description || !duration || !priceRange) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const service = await Service.create({
      title: sanitizeString(title),
      description: sanitizeString(description),
      duration: Number(duration),
      priceRange: sanitizeString(priceRange),
      image,
    });

    res.status(201).json({ success: true, message: 'Service created.', data: service });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Service with this title already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create service.' });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { title, description, duration, priceRange } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    if (title) service.title = sanitizeString(title);
    if (description) service.description = sanitizeString(description);
    if (duration) service.duration = Number(duration);
    if (priceRange) service.priceRange = sanitizeString(priceRange);
    if (req.file) service.image = `/uploads/${req.file.filename}`;

    await service.save();

    res.status(200).json({ success: true, message: 'Service updated.', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update service.' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    res.status(200).json({ success: true, message: 'Service deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete service.' });
  }
};
