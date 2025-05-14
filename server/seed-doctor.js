import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import UserModel from './Models/UserModel.js';
import * as ENV from './config.js';

// Connect to MongoDB
const connectString = `mongodb+srv://${ENV.DB_USER}:${ENV.DB_PASSWORD}@${ENV.DB_CLUSTER}/${ENV.DB_NAME}?retryWrites=true&w=majority`;

mongoose
  .connect(connectString)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Function to seed doctor users
async function seedDoctors() {
  try {
    // Check if doctors already exist to avoid duplicates
    const existingDoctors = await UserModel.find({ userType: 'doctor' });
    if (existingDoctors.length > 0) {
      console.log(`Found ${existingDoctors.length} doctors already in the database`);
      console.log("Existing doctors:", existingDoctors.map(doc => doc.name));
      // If you want to exit without adding more doctors, uncomment the next line
      // return process.exit(0);
    }

    // Sample doctors data
    const doctors = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@medical.com',
        password: 'doctor123',
        userType: 'doctor',
        specialization: 'Cardiology',
        experience: '10 years'
      },
      {
        name: 'Dr. Robert Chen',
        email: 'robert.chen@medical.com',
        password: 'doctor123',
        userType: 'doctor',
        specialization: 'Neurology',
        experience: '8 years'
      },
      {
        name: 'Dr. Emily Wilson',
        email: 'emily.wilson@medical.com',
        password: 'doctor123',
        userType: 'doctor',
        specialization: 'Internal Medicine',
        experience: '12 years'
      },
      {
        name: 'Dr. Michael Davidson',
        email: 'michael.davidson@medical.com',
        password: 'doctor123',
        userType: 'doctor',
        specialization: 'Dermatology',
        experience: '7 years'
      }
    ];

    // Add each doctor to the database
    for (const doctorData of doctors) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(doctorData.password, 10);
      
      // Create new doctor with hashed password
      const doctor = new UserModel({
        ...doctorData,
        password: hashedPassword
      });

      // Save to database
      await doctor.save();
      console.log(`✅ Added doctor: ${doctor.name}`);
    }

    console.log('✅ Doctors seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    process.exit(1);
  }
}

// Execute the seeding function
seedDoctors(); 