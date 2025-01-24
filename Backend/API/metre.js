import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;
app.use(express.json());

// Get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to JSON files for each house
const housePaths = [
  path.join(__dirname, "House1", "metreData.json"),
  path.join(__dirname, "House2", "metreData.json"),
  path.join(__dirname, "House3", "metreData.json"),
  path.join(__dirname, "House4", "metreData.json"),
];

// Helper function to read JSON data from a file
const readJsonFile = (filePath) => {
  return new Promise((resolve, reject) => {
    // Check if filePath is valid
    if (!filePath) {
      return reject(new Error("Invalid file path"));
    }
    // console.log("Reading from file:", filePath); // Debug log
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        return reject(new Error(`Failed to read file at path: ${filePath}`));
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        reject(new Error(`Failed to parse JSON data from file: ${filePath}`));
      }
    });
  });
};

// API route to fetch readings for a specific house
app.post("/api/meters", async (req, res) => {
  const { meterID, mobileNo, requestID } = req.body;

  if (!meterID || !mobileNo || !requestID) {
    return res.status(400).json({ error: "meterID, mobileNo, and requestID are required." });
  }

  try {
    let foundReading = null;

    // Loop through each house path to find the matching data
    for (let i = 0; i < housePaths.length; i++) {
      const filePath = housePaths[i];
      const data = await readJsonFile(filePath);

      // Find the reading from the data
      const reading = data.find((entry) => {
        return (
          entry.meterID === meterID &&
          entry.mobileNo === mobileNo &&
          entry.requestID === requestID
        );
      });

      // If a matching reading is found, break out of the loop
      if (reading) {
        foundReading = reading;
        break;
      }
    }

    // If no matching reading is found, return a 404 error
    if (!foundReading) {
      return res.status(404).json({ error: "Reading not found for the given parameters." });
    }

    // Return the found reading
    res.status(200).json({ reading: foundReading });

  } catch (error) {
    // console.error("Error fetching meter readings:", error);
    res.status(500).json({ error: "Failed to fetch meter readings" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
