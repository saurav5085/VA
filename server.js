require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const moment = require("moment-timezone");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Schema (timestamp as string for IST format)
const AttendanceSchema = new mongoose.Schema({
  name: String,
  timestamp: String, // Store as IST formatted string
});

const Attendance = mongoose.model("Attendance", AttendanceSchema);

// POST Route - Record Attendance in IST
app.post("/attendance", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }

  try {
    const istTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const entry = new Attendance({
      name,
      timestamp: istTime
    });

    await entry.save();
    res.status(201).send("✅ Attendance recorded in IST.");
  } catch (err) {
    console.error("Error saving attendance:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// GET Route - Fetch Attendance by Date (IST match)
app.get('/api/attendance', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date query parameter is required." });
  }

  try {
    const records = await Attendance.find({
      timestamp: {
        $regex: `^${date}`  // Matches date like "2025-04-16"
      }
    });

    const formatted = records.map(record => ({
      name: record.name,
      timestamp: record.timestamp,
      status: "Present"
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Start Server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));
