const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const JWT_SECRET = "mediroute-secret-key-12345";

// JWT Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

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
// 🏥 HOSPITAL SCHEMA
// =====================================================
const hospitalSchema = new mongoose.Schema({
  osmId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  type: { type: String, default: "General Hospital" },
  address: String,
  phone: String,
  icuBeds: { type: Number, default: 0 },
  ventilators: { type: Number, default: 0 },
  generalBeds: { type: Number, default: 0 },
  emergencyDoctors: { type: Number, default: 0 },
  cardiacTeams: { type: Number, default: 0 },
  status: { type: String, default: "Active" },
  isEmergencyReady: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false }, // Must be approved by admin if registering
  lastUpdatedAt: { type: Date, default: Date.now },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null }
});

const Hospital = mongoose.model("Hospital", hospitalSchema);

// =====================================================
// 👑 ADMIN SCHEMA
// =====================================================
const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, default: "System Admin" }
});

const Admin = mongoose.model("Admin", adminSchema);

// =====================================================
// 🚫 BLOCKED/FAKE HOSPITAL SCHEMA
// =====================================================
const blockedHospitalSchema = new mongoose.Schema({
  osmId: { type: String, unique: true },
  name: { type: String },
  blockedAt: { type: Date, default: Date.now }
});

const BlockedHospital = mongoose.model("BlockedHospital", blockedHospitalSchema);

// =====================================================
// ❌ DECLINED HOSPITAL DISPATCH SCHEMA
// =====================================================
const declinedHospitalSchema = new mongoose.Schema({
  driverEmail: { type: String, required: true },
  hospitalName: { type: String, required: true },
  declinedAt: { type: Date, default: Date.now }
});

const DeclinedHospital = mongoose.model("DeclinedHospital", declinedHospitalSchema);


// Seed default Admin if not exists
const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        email: "admin@mediroute.com",
        password: "admin123",
        name: "MediRoute Admin"
      });
      console.log("👑 Default admin account seeded: admin@mediroute.com / admin123");
    }
  } catch (err) {
    console.error("❌ Error seeding admin account:", err);
  }
};
seedAdmin();


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
// 🚗 DRIVER RESET DECLINES
// =====================================================
app.post("/api/driver/reset-declines", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }
    
    await DeclinedHospital.deleteMany({ driverEmail: email });
    console.log(`🧹 Cleared declined hospitals list for driver: ${email}`);
    res.json({ message: "Declined hospitals list reset successfully" });
  } catch (error) {
    console.error("❌ Reset Declines Error:", error);
    res.status(500).json({ message: "Error resetting declined list" });
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

    const token = jwt.sign({ id: driver._id, email: driver.email, role: "driver" }, JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({
      message: "Login successful",
      token,
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

    // Sync via socket to the specific hospital
    const hospitalName = newPatient.selectedHospital;
    if (hospitalName) {
      const hospital = await Hospital.findOne({ name: hospitalName });
      if (hospital && hospital._id) {
        console.log(`📣 HTTP Fallback: Forwarding patient request to hospital room: hospital:${hospital._id}`);
        io.to(`hospital:${hospital._id}`).emit("incoming_patient_request", {
          ...newPatient.toObject(),
          patientId: newPatient._id
        });
      }
    }

    // Emit to admin room
    io.to("admin_room").emit("system_activity", {
      type: "patient_request",
      message: `Ambulance driver ${newPatient.driverEmail} requested admission at ${hospitalName} (HTTP)`,
      timestamp: new Date()
    });

    res.status(200).json({ message: "Patient details saved successfully!", patientId: newPatient._id });
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
    
    // Auto-decrement bed/ventilator counts in MongoDB if patient gets admitted
    if (updated && updated.selectedHospital) {
      const updatedNeeds = updated.medicalNeeds || [];
      const isIcuNeed = updatedNeeds.includes('ICU Bed');
      const isVentNeed = updatedNeeds.includes('Ventilator');
      
      if (isIcuNeed || isVentNeed) {
        const hosp = await Hospital.findOne({ name: updated.selectedHospital });
        if (hosp) {
          if (isIcuNeed) hosp.icuBeds = Math.max(0, hosp.icuBeds - 1);
          if (isVentNeed) hosp.ventilators = Math.max(0, hosp.ventilators - 1);
          hosp.lastUpdatedAt = new Date();
          await hosp.save();
        }
      }
    }

    // Create notification for driver
    if (updated.driverEmail) {
      await Notification.create({
        driverEmail: updated.driverEmail,
        patientId: updated._id,
        patientName: updated.patientName,
        hospitalName: updated.selectedHospital || "City General Hospital",
        status: "accepted",
        message: `Patient admission accepted by ${updated.selectedHospital || "City General Hospital"}. Proceed to hospital.`
      });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error accepting patient:", error);
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
        hospitalName: updated.selectedHospital || "City General Hospital",
        status: "declined",
        message: `Patient admission declined by ${updated.selectedHospital || "City General Hospital"}.`,
        reason: reason
      });

      // Save to DeclinedHospital tracking list so it is filtered out from future searches
      if (updated.selectedHospital) {
        await DeclinedHospital.create({
          driverEmail: updated.driverEmail,
          hospitalName: updated.selectedHospital
        }).catch(e => console.warn("Error creating DeclinedHospital:", e.message));
      }
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error declining patient:", error);
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
// 🏥 HOSPITAL CAPACITIES APIs
// =====================================================

// 🔄 Sync OSM Query Results with MongoDB database (registers new nodes, loads stored capacity)
app.post("/api/hospitals/sync", async (req, res) => {
  try {
    const { hospitals, driverEmail } = req.body;
    if (!hospitals || !Array.isArray(hospitals)) {
      return res.status(400).json({ message: "Invalid hospitals array" });
    }

    const syncedHospitals = [];
    const consumedRegisteredIds = new Set();
    const normalize = (s) => (s || "").trim().toLowerCase();

    // 1. Fetch blocked/fake hospitals
    const blockedList = await BlockedHospital.find();
    const blockedOsmIds = new Set(blockedList.filter(b => b.osmId).map(b => b.osmId));
    const blockedNames = new Set(blockedList.filter(b => b.name).map(b => normalize(b.name)));

    // 2. Fetch hospitals declined by this driver
    const declinedList = driverEmail ? await DeclinedHospital.find({ driverEmail }) : [];
    const declinedNames = new Set(declinedList.map(d => normalize(d.hospitalName)));

    // 3. Merge capacity from any registered portal hospital (matched by name) onto OSM results.
    for (const h of hospitals) {
      const hNameNorm = normalize(h.name);
      
      // Skip if blocked/fake
      if (blockedOsmIds.has(h.id.toString()) || blockedNames.has(hNameNorm)) {
        console.log(`🚫 Sync: Skipping blocked hospital ${h.name}`);
        continue;
      }

      // Skip if declined for this driver
      if (declinedNames.has(hNameNorm)) {
        console.log(`❌ Sync: Skipping declined hospital ${h.name} for driver ${driverEmail}`);
        continue;
      }

      let dbHospital = await Hospital.findOne({ osmId: h.id.toString() });
      if (!dbHospital) {
        // Register new hospital in MongoDB with default capacity numbers (auto-approved by default)
        dbHospital = new Hospital({
          osmId: h.id.toString(),
          name: h.name,
          type: h.type,
          address: h.address,
          phone: h.phone,
          generalBeds: Number(h.generalBeds || 0),
          icuBeds: Number(h.icuBeds || 0),
          ventilators: Number(h.ventilators || 0),
          emergencyDoctors: Number(h.emergencyDoctors || 0),
          cardiacTeams: Number(h.cardiacTeams || 0),
          status: h.status || "Active",
          isEmergencyReady: h.isEmergencyReady !== undefined ? h.isEmergencyReady : true,
          isApproved: true,
          lat: h.lat,
          lng: h.lng
        });
        await dbHospital.save();
      }

      // Skip if database hospital has been unapproved/marked fake
      if (dbHospital.isApproved === false) {
        continue;
      }

      // Also check if a registered portal hospital exists with the same name
      // and overlay its live capacity (and approved portal metadata) onto this OSM result.
      let portalMatch = null;
      if (h.name) {
        portalMatch = await Hospital.findOne({
          email: { $exists: true, $ne: null },
          name: { $regex: `^${normalize(h.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
        });
        if (portalMatch) {
          consumedRegisteredIds.add(portalMatch._id.toString());
          if (portalMatch.isApproved === false) {
            continue; // Skip if registered hospital was unapproved
          }
        }
      }

      const capacitySource = portalMatch || dbHospital;

      // Merge live database capacities with hospital OSM coordinates
      syncedHospitals.push({
        ...h,
        id: h.id,
        // The driver card reads these four fields - they MUST reflect the hospital login values
        generalBeds: capacitySource.generalBeds,
        icuBeds: capacitySource.icuBeds,
        ventilators: capacitySource.ventilators,
        emergencyDoctors: capacitySource.emergencyDoctors,
        cardiacTeams: capacitySource.cardiacTeams,
        status: capacitySource.status,
        lastUpdatedAt: capacitySource.lastUpdatedAt,
        dbId: dbHospital._id,
        // Surface portal metadata so driver card can show real phone/address
        address: capacitySource.address || h.address,
        phone: capacitySource.phone || h.phone,
        type: capacitySource.type || h.type
      });
    }

    // 4. Append any approved registered hospitals that are NOT represented in the OSM
    //    result set (driver should still see them and be able to dispatch to them).
    const registeredHospitals = await Hospital.find({
      email: { $exists: true, $ne: null },
      isApproved: true
    });

    for (const reg of registeredHospitals) {
      if (consumedRegisteredIds.has(reg._id.toString())) continue;
      const regNameNorm = normalize(reg.name);

      // Skip if blocked/fake
      if ((reg.osmId && blockedOsmIds.has(reg.osmId)) || blockedNames.has(regNameNorm)) {
        continue;
      }

      // Skip if declined for this driver
      if (declinedNames.has(regNameNorm)) {
        continue;
      }

      // Skip if an OSM entry with the same name was already merged
      const alreadyInList = syncedHospitals.find(
        (s) => normalize(s.name) === regNameNorm
      );
      if (alreadyInList) continue;

      // Geocode in background if lat/lng is missing to enrich database
      if (reg.lat === undefined || reg.lat === null || reg.lng === undefined || reg.lng === null) {
        (async () => {
          try {
            const query = `${reg.name}, ${reg.address}`;
            const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
              headers: { "User-Agent": "MediRoute-App" }
            });
            const geocodeData = await geocodeRes.json();
            if (geocodeData && geocodeData.length > 0) {
              reg.lat = parseFloat(geocodeData[0].lat);
              reg.lng = parseFloat(geocodeData[0].lon);
              await reg.save();
              console.log(`✅ Geocoded ${reg.name} successfully:`, reg.lat, reg.lng);
            } else {
              const geocodeRes2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(reg.address)}&format=json&limit=1`, {
                headers: { "User-Agent": "MediRoute-App" }
              });
              const geocodeData2 = await geocodeRes2.json();
              if (geocodeData2 && geocodeData2.length > 0) {
                reg.lat = parseFloat(geocodeData2[0].lat);
                reg.lng = parseFloat(geocodeData2[0].lon);
                await reg.save();
                console.log(`✅ Geocoded ${reg.name} by address successfully:`, reg.lat, reg.lng);
              }
            }
          } catch (e) {
            console.warn(`⚠️ Background geocoding failed for ${reg.name}:`, e.message);
          }
        })();
      }

      syncedHospitals.push({
        id: reg.osmId || reg._id.toString(),
        osmId: reg.osmId,
        name: reg.name,
        address: reg.address || "Tamil Nadu, India",
        lat: reg.lat,
        lng: reg.lng,
        distance: "—",
        eta: "—",
        distanceValue: 0,
        specialties: [],
        phone: reg.phone || "+91 000 0000000",
        generalBeds: reg.generalBeds || 0,
        icuBeds: reg.icuBeds || 0,
        ventilators: reg.ventilators || 0,
        emergencyDoctors: reg.emergencyDoctors || 0,
        cardiacTeams: reg.cardiacTeams || 0,
        type: reg.type || "Multi-Specialty Trauma Hospital",
        status: reg.status || "Active",
        isEmergencyReady: reg.isEmergencyReady !== false,
        lastUpdatedAt: reg.lastUpdatedAt,
        dbId: reg._id
      });
    }

    res.json(syncedHospitals);
  } catch (error) {
    console.error("❌ Hospital sync error:", error);
    res.status(500).json({ message: "Error syncing hospitals: " + error.message });
  }
});

// 📋 Get specific hospital info by name
app.get("/api/hospitals/info/:name", async (req, res) => {
  try {
    let hospital = await Hospital.findOne({ name: req.params.name });
    if (!hospital) {
      // Register it manually in MongoDB if requested but not synced yet
      hospital = new Hospital({
        osmId: "manual_" + Math.random().toString(36).substr(2, 9),
        name: req.params.name,
        type: "Multi-Specialty Trauma Hospital",
        address: "Salem, Tamil Nadu",
        phone: "+91 427 466483",
        icuBeds: 12,
        ventilators: 6,
        cardiacTeams: 2,
        status: "Active",
        isEmergencyReady: true
      });
      await hospital.save();
    }
    res.json(hospital);
  } catch (error) {
    console.error("❌ Get Hospital Error:", error);
    res.status(500).json({ message: "Error loading hospital capacities" });
  }
});

// ⚙️ Update hospital resource capacity
app.post("/api/hospitals/:id/capacity", async (req, res) => {
  try {
    const { icuBeds, ventilators, status } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { 
        icuBeds: Number(icuBeds), 
        ventilators: Number(ventilators),
        status: status || "Active",
        lastUpdatedAt: new Date()
      },
      { new: true }
    );
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    res.json(hospital);
  } catch (error) {
    console.error("❌ Update Capacity Error:", error);
    res.status(500).json({ message: "Error saving capacity modifications" });
  }
});


// =====================================================
// 👑 ADMIN APIs
// =====================================================

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const admin = await Admin.findOne({ email });
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    
    const token = jwt.sign({ id: admin._id, email: admin.email, role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.json({
      message: "Admin login successful",
      token,
      admin: { name: admin.name, email: admin.email }
    });
  } catch (error) {
    console.error("❌ Admin Login Error:", error);
    res.status(500).json({ message: "Error logging in admin" });
  }
});

// Get all registered hospitals (for Admin review)
app.get("/api/admin/hospitals", authenticateToken, async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ lastUpdatedAt: -1 });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hospitals list" });
  }
});

// Approve hospital
app.put("/api/admin/hospitals/:id/approve", authenticateToken, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    console.log(`✅ Hospital approved by admin: ${hospital.name}`);
    res.json({ message: "Hospital approved successfully", hospital });
  } catch (error) {
    res.status(500).json({ message: "Error approving hospital" });
  }
});

// Reject/Disapprove hospital
app.put("/api/admin/hospitals/:id/reject", authenticateToken, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    );
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    console.log(`❌ Hospital registration rejected by admin: ${hospital.name}`);
    res.json({ message: "Hospital rejected successfully", hospital });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting hospital" });
  }
});

// Delete hospital
app.delete("/api/admin/hospitals/:id", authenticateToken, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    
    // Add to BlockedHospital list so it won't be re-created on driver sync
    if (hospital.osmId || hospital.name) {
      await BlockedHospital.create({
        osmId: hospital.osmId,
        name: hospital.name
      }).catch(e => console.log("BlockedHospital entry creation:", e.message));
    }

    console.log(`🗑️ Hospital deleted by admin: ${hospital.name}`);
    res.json({ message: "Hospital account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting hospital account" });
  }
});

// Get system stats
app.get("/api/admin/stats", authenticateToken, async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments();
    const approvedHospitals = await Hospital.countDocuments({ isApproved: true });
    const pendingHospitals = await Hospital.countDocuments({ isApproved: false, email: { $exists: true } });
    const totalAmbulances = await Driver.countDocuments();
    const activeRequests = await Patient.countDocuments({ status: "pending" });
    const totalRequests = await Patient.countDocuments();
    
    // Resource statistics
    const hospitalsList = await Hospital.find({ isApproved: true });
    let totalIcu = 0, totalVents = 0, totalGeneral = 0, totalDoctors = 0;
    hospitalsList.forEach(h => {
      totalIcu += (h.icuBeds || 0);
      totalVents += (h.ventilators || 0);
      totalGeneral += (h.generalBeds || 0);
      totalDoctors += (h.emergencyDoctors || 0);
    });

    res.json({
      totalHospitals,
      approvedHospitals,
      pendingHospitals,
      totalAmbulances,
      activeRequests,
      totalRequests,
      resources: {
        icuBeds: totalIcu,
        ventilators: totalVents,
        generalBeds: totalGeneral,
        emergencyDoctors: totalDoctors
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching system statistics" });
  }
});

// =====================================================
// 🏥 HOSPITAL AUTHENTICATION APIs
// =====================================================

// Register Hospital
app.post("/api/hospital/register", async (req, res) => {
  try {
    const { name, email, password, address, phone, type } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    
    const existing = await Hospital.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Hospital with this email already registered" });
    }
    
    // Try to geocode hospital address/name during registration
    let lat = null;
    let lng = null;
    try {
      const query = `${name}, ${address}`;
      const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { "User-Agent": "MediRoute-App" }
      });
      const geocodeData = await geocodeRes.json();
      if (geocodeData && geocodeData.length > 0) {
        lat = parseFloat(geocodeData[0].lat);
        lng = parseFloat(geocodeData[0].lon);
      } else {
        const geocodeRes2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
          headers: { "User-Agent": "MediRoute-App" }
        });
        const geocodeData2 = await geocodeRes2.json();
        if (geocodeData2 && geocodeData2.length > 0) {
          lat = parseFloat(geocodeData2[0].lat);
          lng = parseFloat(geocodeData2[0].lon);
        }
      }
    } catch (e) {
      console.warn("Geocoding failed during registration:", e.message);
    }

    const newHospital = new Hospital({
      osmId: "hosp_" + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password,
      address: address || "Tamil Nadu, India",
      phone: phone || "+91 000 0000000",
      type: type || "General Emergency Care",
      isApproved: true, // Auto-approved so hospital can immediately update capacity for drivers
      icuBeds: 0,
      ventilators: 0,
      generalBeds: 0,
      emergencyDoctors: 0,
      lat,
      lng
    });
    
    await newHospital.save();
    console.log(`🏥 New hospital registered and auto-approved: ${name} (Lat: ${lat}, Lng: ${lng})`);

    res.status(201).json({
      message: "Registration successful! You can now log in and update your live capacity.",
      hospital: { name: newHospital.name, email: newHospital.email }
    });
  } catch (error) {
    console.error("❌ Hospital Register Error:", error);
    res.status(500).json({ message: "Error registering hospital: " + error.message });
  }
});

// Login Hospital
app.post("/api/hospital/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const hospital = await Hospital.findOne({ email });
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found with this email" });
    }
    
    if (hospital.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    
    if (!hospital.isApproved) {
      return res.status(403).json({ message: "Your registration is pending approval by the Admin." });
    }
    
    const token = jwt.sign({ id: hospital._id, email: hospital.email, role: "hospital" }, JWT_SECRET, { expiresIn: "24h" });
    
    res.json({
      message: "Login successful",
      token,
      hospital: {
        id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        icuBeds: hospital.icuBeds,
        ventilators: hospital.ventilators,
        generalBeds: hospital.generalBeds,
        emergencyDoctors: hospital.emergencyDoctors
      }
    });
  } catch (error) {
    console.error("❌ Hospital Login Error:", error);
    res.status(500).json({ message: "Error logging in hospital" });
  }
});

// Fetch Hospital profile details (secure)
app.get("/api/hospital/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ message: "Access forbidden" });
    }
    const hospital = await Hospital.findById(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital profile not found" });
    }
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Update Hospital profile resources (secure)
app.put("/api/hospital/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ message: "Access forbidden" });
    }
    
    const { icuBeds, ventilators, generalBeds, emergencyDoctors, phone, address } = req.body;
    
    const hospital = await Hospital.findById(req.user.id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital profile not found" });
    }
    
    if (icuBeds !== undefined) hospital.icuBeds = Number(icuBeds);
    if (ventilators !== undefined) hospital.ventilators = Number(ventilators);
    if (generalBeds !== undefined) hospital.generalBeds = Number(generalBeds);
    if (emergencyDoctors !== undefined) hospital.emergencyDoctors = Number(emergencyDoctors);
    if (phone !== undefined) hospital.phone = phone;
    if (address !== undefined) hospital.address = address;
    
    hospital.lastUpdatedAt = new Date();
    await hospital.save();
    
    console.log(`🔄 Hospital capacities updated for ${hospital.name}`);
    
    // Broadcast availability update to all sockets
    io.emit("hospital_resource_updated", {
      hospitalId: hospital._id,
      name: hospital.name,
      icuBeds: hospital.icuBeds,
      ventilators: hospital.ventilators,
      generalBeds: hospital.generalBeds,
      emergencyDoctors: hospital.emergencyDoctors,
      lastUpdatedAt: hospital.lastUpdatedAt
    });
    
    res.json({ message: "Hospital capacity updated successfully", hospital });
  } catch (error) {
    console.error("❌ Update Hospital Profile Error:", error);
    res.status(500).json({ message: "Error updating hospital capacities" });
  }
});

// =====================================================
// 🔌 SOCKET.IO REAL-TIME ROUTING
// =====================================================
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Driver/Hospital registers their room identification
  socket.on("join_room", (data) => {
    const { role, email, id } = data;
    if (role === "driver" && email) {
      socket.join(`driver:${email}`);
      console.log(`🚗 Driver joined room: driver:${email}`);
    } else if (role === "hospital" && id) {
      socket.join(`hospital:${id}`);
      console.log(`🏥 Hospital joined room: hospital:${id}`);
    } else if (role === "admin") {
      socket.join("admin_room");
      console.log(`👑 Admin joined room: admin_room`);
    }
  });

  // Driver sends a patient request
  socket.on("submit_patient_request", async (patientData) => {
    try {
      console.log("🚑 Live patient request received from driver:", patientData.driverEmail);
      
      // Save patient data to database first
      const newPatient = new Patient(patientData);
      await newPatient.save();

      // Find the hospital in DB to get its ID/name using unique hospitalId if available
      const hospitalId = patientData.hospitalId;
      let hospital = null;
      if (hospitalId) {
        hospital = await Hospital.findById(hospitalId);
      } else {
        hospital = await Hospital.findOne({ name: patientData.selectedHospital });
      }
      
      // Add patient ID to data
      const responseData = {
        ...newPatient.toObject(),
        patientId: newPatient._id
      };
      
      // Emit to hospital room if they are online
      if (hospital && hospital._id) {
        console.log(`📣 Forwarding request in real-time to hospital room: hospital:${hospital._id}`);
        io.to(`hospital:${hospital._id}`).emit("incoming_patient_request", responseData);
      }
      
      // Emit to admin room
      io.to("admin_room").emit("system_activity", {
        type: "patient_request",
        message: `Ambulance driver ${patientData.driverEmail} requested admission at ${patientData.selectedHospital}`,
        timestamp: new Date()
      });
      
    } catch (err) {
      console.error("Socket error saving patient request:", err);
    }
  });

  // Hospital responds (Accept / Reject)
  socket.on("respond_patient_request", async (data) => {
    const { patientId, status, reason, hospitalName } = data;
    console.log(`🏥 Hospital ${hospitalName} responded to request ${patientId}: ${status}`);
    
    try {
      const patient = await Patient.findById(patientId);
      if (!patient) return;
      
      patient.status = status === "accepted" ? "admitted" : "declined";
      if (reason) patient.declineReason = reason;
      await patient.save();

      // If accepted, auto-decrement hospital capacity
      if (status === "accepted") {
        const updatedNeeds = patient.medicalNeeds || [];
        const isIcuNeed = updatedNeeds.includes('ICU Bed');
        const isVentNeed = updatedNeeds.includes('Ventilator');
        
        const hosp = await Hospital.findOne({ name: hospitalName });
        if (hosp) {
          if (isIcuNeed) hosp.icuBeds = Math.max(0, hosp.icuBeds - 1);
          if (isVentNeed) hosp.ventilators = Math.max(0, hosp.ventilators - 1);
          hosp.lastUpdatedAt = new Date();
          await hosp.save();

          // Broadcast resource change
          io.emit("hospital_resource_updated", {
            hospitalId: hosp._id,
            name: hosp.name,
            icuBeds: hosp.icuBeds,
            ventilators: hosp.ventilators,
            generalBeds: hosp.generalBeds,
            emergencyDoctors: hosp.emergencyDoctors,
            lastUpdatedAt: hosp.lastUpdatedAt
          });
        }
      } else if (status === "declined") {
        // Record decline in DeclinedHospital collection to filter this hospital out for this driver
        if (patient.driverEmail && hospitalName) {
          await DeclinedHospital.create({
            driverEmail: patient.driverEmail,
            hospitalName: hospitalName
          }).catch(e => console.warn("Error creating DeclinedHospital in socket:", e.message));
        }
      }

      // Create notification
      const notification = await Notification.create({
        driverEmail: patient.driverEmail,
        patientId: patient._id,
        patientName: patient.patientName,
        hospitalName: hospitalName,
        status: status,
        message: status === "accepted" 
          ? `Patient admission accepted by ${hospitalName}. Proceed to hospital.`
          : `Patient admission declined by ${hospitalName}.`,
        reason: reason || ""
      });

      // Send real-time notification to driver
      if (patient.driverEmail) {
        console.log(`📣 Sending status '${status}' to driver room: driver:${patient.driverEmail}`);
        io.to(`driver:${patient.driverEmail}`).emit("patient_request_response", {
          patientId: patient._id,
          patientName: patient.patientName,
          hospitalName: hospitalName,
          status: status,
          reason: reason || "",
          notificationId: notification._id
        });
      }

      // Send to admin room
      io.to("admin_room").emit("system_activity", {
        type: "request_resolved",
        message: `${hospitalName} ${status} request for ${patient.patientName}`,
        timestamp: new Date()
      });

    } catch (err) {
      console.error("Socket error resolving patient request:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// =====================================================
// 📁 Serve static files (after API routes)
// =====================================================
app.use(express.static(path.join(__dirname, "client/dist")));

// Fallback for React Router (Single Page Application)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist", "index.html"));
});

// =====================================================
// 🚀 Start Server
// =====================================================
const PORT = 5000;
server.listen(PORT, () => console.log(`🚑 Server running on http://localhost:${PORT}`));