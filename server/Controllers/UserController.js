import UserModel from '../Models/UserModel.js';
import bcrypt from 'bcrypt';

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, userType, specialization, experience } = req.body;
    const hashedpassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name,
      email,
      password: hashedpassword,
      userType: userType || 'user',
      ...(userType === 'doctor' && { specialization, experience })
    });

    await user.save();
    res.send({ user: user, msg: "Added." });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === 11000) {
      // MongoDB duplicate key error (likely email already exists)
      return res.status(400).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: "An error occurred during registration" });
  }
};

// Login a user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return res.status(500).json({ error: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    res.status(200).json({ user, message: "Success." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout a user
export const logoutUser = async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    console.log("Getting all doctors");
    // Find all users with userType 'doctor'
    const doctors = await UserModel.find({ userType: 'doctor' })
      .select('name email specialization experience') // Select only necessary fields
      .sort({ name: 1 }); // Sort by name alphabetically
    
    console.log(`Found ${doctors.length} doctors`);
    // Return the doctors
    res.status(200).json({ doctors, count: doctors.length });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "An error occurred while fetching doctors" });
  }
}; 