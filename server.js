const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/mediroute", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Connection Error:", err));


// =====================================================
// 🏥 PATIENT SCHEMA
// =====================================================
const patientSchema = new mongoose.Schema({
  patientName: String,
  age: Number,
  gender: String,
  medicalCondition: String,
  bloodPressure: String,
  heartRate: Number,
  oxygenSaturation: Number,
  allergies: String,
  medicalNeeds: [String],
  additionalNotes: String,
  selectedHospital: String,
  driverEmail: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  status: { type: String, default: "pending" },
  declineReason: String,
  createdAt: { type: Date, default: Date.now }
});

const Patient = mongoose.model("Patient", patientSchema);


// =====================================================
// 🚗 DRIVER SCHEMA (Login + Register)
// =====================================================
const driverSchema = new mongoose.Schema({
  driverName: String,
  email: String,
  password: String,
  phone: String,
  licenceNumber: String,
  registeredAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null }
});

const Driver = mongoose.model("Driver", driverSchema);

// =====================================================
// 🔔 NOTIFICATION SCHEMA
// =====================================================
const notificationSchema = new mongoose.Schema({
  driverEmail: String,
  patientId: String,
  patientName: String,
  hospitalName: String,
  status: String, // 'accepted' or 'declined'
  message: String,
  reason: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model("Notification", notificationSchema);

// =====================================================
// 📧 CONTACT FORM SCHEMA
// =====================================================
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  organization: String,
  phone: String,
  subject: String,
  message: String,
  status: { type: String, default: "new" }, // new, read, replied
  submittedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model("Contact", contactSchema);


// =====================================================
// 📧 CONTACT FORM API
// =====================================================
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, organization, phone, subject, message, submittedAt } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "Name, email, subject, and message are required" });
    }
    
    // Create new contact entry
    const newContact = new Contact({
      name,
      email,
      organization,
      phone,
      subject,
      message,
      submittedAt: submittedAt || new Date()
    });
    
    await newContact.save();
    
    console.log("✅ New contact form submitted:", { 
      name, 
      email, 
      subject,
      submittedAt: new Date()
    });
    
    res.status(200).json({ 
      message: "Contact form submitted successfully!",
      contact: {
        name: newContact.name,
        email: newContact.email,
        subject: newContact.subject,
        submittedAt: newContact.submittedAt
      }
    });
  } catch (error) {
    console.error("❌ Contact Form Error:", error);
    res.status(500).json({ message: "Error submitting contact form: " + error.message });
  }
});

// =====================================================
// 📧 GET ALL CONTACT SUBMISSIONS (Admin)
// =====================================================
app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ submittedAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contact submissions" });
  }
});

// =====================================================
// 📧 UPDATE CONTACT STATUS (Admin)
// =====================================================
app.put("/api/contacts/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating contact status" });
  }
});


// =====================================================
// 🚗 DRIVER REGISTER (STORES DATA IN DATABASE)
// =====================================================
app.post("/api/driver/register", async (req, res) => {
  try {
    const { driverName, email, password, phone, licenceNumber } = req.body;
    
    // Validate required fields
    if (!driverName || !email || !password || !phone || !licenceNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Check if driver already exists
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ message: "Driver with this email already exists" });
    }
    
    // Create new driver 
    const newDriver = new Driver({
      driverName,
      email,
      password,
      phone,
      licenceNumber
    });
    
    await newDriver.save();
    
    console.log("✅ New driver registered:", { driverName, email, phone, licenceNumber });
    
    res.status(200).json({ 
      message: "Driver registered successfully!",
      driver: {
        driverName: newDriver.driverName,
        email: newDriver.email,
        phone: newDriver.phone,
        licenceNumber: newDriver.licenceNumber,
        createdAt: newDriver.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Register Error:", error);
    res.status(500).json({ message: "Error registering driver: " + error.message });
  }
});


// =====================================================
// 🚗 GET CURRENT DRIVER (FOR PATIENT FORM)
// =====================================================
app.post("/api/driver/current", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }
    
    const driver = await Driver.findOne({ email });
    
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    
    res.json({
      driverName: driver.driverName,
      email: driver.email,
      phone: driver.phone,
      licenceNumber: driver.licenceNumber
    });
  } catch (error) {
    console.error("❌ Get Driver Error:", error);
    res.status(500).json({ message: "Error fetching driver data" });
  }
});

// =====================================================
// 🚗 DRIVER LOGIN (CHECKS DATA FROM DATABASE)
// =====================================================
app.post("/api/driver/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find driver by email
    const driver = await Driver.findOne({ email });

    if (!driver) {
      console.log("❌ Login attempt - Driver not found:", email);
      return res.status(404).json({ message: "Driver not found" });
    }

    // Match password
    if (driver.password !== password) {
      console.log("❌ Login attempt - Incorrect password for:", email);
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Update last login time
    driver.lastLogin = new Date();
    await driver.save();

    console.log("✅ Driver logged in successfully:", { 
      driverName: driver.driverName, 
      email: driver.email,
      loginTime: new Date()
    });

    res.status(200).json({
      message: "Login successful",
      driver: {
        driverName: driver.driverName,
        email: driver.email,
        phone: driver.phone,
        licenceNumber: driver.licenceNumber,
        createdAt: driver.createdAt,
        lastLogin: driver.lastLogin
      }
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Error logging in: " + error.message });
  }
});


// =====================================================
// 🏥 PATIENT APIs
// =====================================================

// 🚑 Ambulance form submission
app.post("/api/patient", async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.status(200).json({ message: "Patient details saved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving patient" });
  }
});

// 🏥 Get all pending patients
app.get("/api/patients/pending", async (req, res) => {
  try {
    const patients = await Patient.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Error loading pending patients" });
  }
});

// 🟢 Accept patient
app.post("/api/patients/:id/accept", async (req, res) => {
  try {
    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: "admitted" },
      { new: true }
    );
    
    // Create notification for driver
    if (updated.driverEmail) {
      await Notification.create({
        driverEmail: updated.driverEmail,
        patientId: updated._id,
        patientName: updated.patientName,
        hospitalName: "City General Hospital",
        status: "accepted",
        message: "Patient admission accepted. Proceed to hospital."
      });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error admitting patient" });
  }
});

// 🔴 Decline patient
app.post("/api/patients/:id/decline", async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: "declined", declineReason: reason },
      { new: true }
    );
    
    // Create notification for driver
    if (updated.driverEmail) {
      await Notification.create({
        driverEmail: updated.driverEmail,
        patientId: updated._id,
        patientName: updated.patientName,
        hospitalName: "City General Hospital",
        status: "declined",
        message: "Patient admission declined.",
        reason: reason
      });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error declining patient" });
  }
});

// 📋 Get specific patient by ID with driver details
app.get("/api/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    
    // Fetch driver details from drivers collection
    let driverDetails = null;
    if (patient.driverEmail) {
      driverDetails = await Driver.findOne({ email: patient.driverEmail });
    }
    
    // Combine patient data with driver details
    const patientWithDriver = {
      ...patient.toObject(),
      driverName: driverDetails?.driverName || 'Unknown Driver',
      driverPhone: driverDetails?.phone || 'N/A',
      driverLicense: driverDetails?.licenceNumber || 'N/A'
    };
    
    res.json(patientWithDriver);
  } catch (error) {
    res.status(500).json({ message: "Error fetching patient" });
  }
});

// 🔔 Get notifications for driver
app.get("/api/notifications/:email", async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      driverEmail: req.params.email,
      isRead: false 
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// 🔔 Mark notification as read
app.post("/api/notifications/:id/read", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
});


// =====================================================
// 📁 Serve static files (after API routes)
// =====================================================
app.use(express.static(__dirname));

// Redirect root to home.html
app.get('/', (req, res) => {
  res.redirect('/home.html');
});

// =====================================================
// 🚀 Start Server
// =====================================================
const PORT = 5000;
app.listen(PORT, () => console.log(`🚑 Server running on http://localhost:${PORT}`));