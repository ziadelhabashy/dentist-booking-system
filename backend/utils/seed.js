require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Service = require('../models/Service');
const connectDB = require('../config/db');

const defaultServices = [
  {
    title: 'General Dentistry',
    description:
      'Comprehensive oral health care including examinations, preventive care, and treatment of common dental issues to maintain your healthy smile.',
    duration: 45,
    priceRange: '$80 - $150',
    image: '',
  },
  {
    title: 'Teeth Cleaning',
    description:
      'Professional dental cleaning to remove plaque, tartar, and stains. Includes polishing and fluoride treatment for optimal oral hygiene.',
    duration: 60,
    priceRange: '$100 - $180',
    image: '',
  },
  {
    title: 'Teeth Whitening',
    description:
      'Advanced whitening treatments to brighten your smile safely and effectively, removing years of stains and discoloration.',
    duration: 90,
    priceRange: '$250 - $450',
    image: '',
  },
  {
    title: 'Dental Fillings',
    description:
      'Tooth-colored composite fillings to restore teeth affected by cavities while maintaining a natural appearance.',
    duration: 45,
    priceRange: '$120 - $250',
    image: '',
  },
  {
    title: 'Root Canal Treatment',
    description:
      'Expert endodontic care to save infected teeth, relieve pain, and preserve your natural smile with minimal discomfort.',
    duration: 90,
    priceRange: '$600 - $1,200',
    image: '',
  },
  {
    title: 'Dental Crowns',
    description:
      'Custom-crafted crowns to restore damaged or weakened teeth, providing strength, protection, and a beautiful natural look.',
    duration: 60,
    priceRange: '$800 - $1,500',
    image: '',
  },
  {
    title: 'Dental Implants',
    description:
      'Permanent tooth replacement solution using titanium implants for a secure, natural-feeling restoration.',
    duration: 120,
    priceRange: '$2,500 - $4,500',
    image: '',
  },
  {
    title: 'Orthodontics',
    description:
      'Braces and aligner treatments to straighten teeth, correct bite issues, and create a perfectly aligned smile.',
    duration: 45,
    priceRange: '$3,000 - $6,000',
    image: '',
  },
  {
    title: 'Pediatric Dentistry',
    description:
      'Gentle, child-friendly dental care designed to create positive experiences and establish lifelong healthy habits.',
    duration: 30,
    priceRange: '$70 - $130',
    image: '',
  },
  {
    title: 'Cosmetic Dentistry',
    description:
      'Transform your smile with veneers, bonding, and aesthetic treatments tailored to your unique facial features.',
    duration: 60,
    priceRange: '$500 - $2,000',
    image: '',
  },
];

const seed = async () => {
  try {
    await connectDB();

    await Service.deleteMany({});
    await Service.insertMany(defaultServices);
    console.log('Services seeded successfully.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@drsaragalal.com';
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await Admin.create({
        name: process.env.ADMIN_NAME || 'Dr. Sara Galal',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      });
      console.log(`Admin created: ${adminEmail}`);
    } else {
      console.log('Admin already exists.');
    }

    console.log('Database seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
