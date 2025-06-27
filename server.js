// Backend to keep your API key safe
// Converted to ES Module syntax to resolve 'require is not defined' error

// Import statements for ES Modules
import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // node-fetch is needed if running outside a modern Node.js environment where fetch is global

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Your Gemini API key MUST be set as an environment variable in Render.
// For example, in Render's dashboard for this service, under 'Environment' settings,
// add a new variable with Key: GEMINI_API_KEY and your actual API Key as its Value.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Middleware setup
app.use(cors()); // Enables Cross-Origin Resource Sharing for all origins (for development)
app.use(express.json()); // Parses incoming JSON requests

// POST endpoint to handle requests to the Gemini API
app.post("/ask-gemini", async (req, res) => {
  try {
    const body = req.body; // The request body contains the chat history and generation config from the frontend

    // Make a fetch call to the Google Generative Language API
    // Ensure GEMINI_API_KEY is correctly set in Render's environment variables
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body), // Stringify the request body for the API call
      }
    );

    // Parse the JSON response from the Gemini API
    const data = await response.json();

    // Send the data received from the Gemini API back to the frontend
    res.json(data);
  } catch (error) {
    // Log the error for debugging purposes on the server side
    console.error("Error in /ask-gemini endpoint:", error);
    // Send a 500 status code and an error message back to the frontend
    res.status(500).json({ error: "Failed to communicate with AI.", details: error.message });
  }
});

// Basic GET endpoint for health check or verification that the backend is running
app.get("/", (req, res) => {
  res.send("Gemini Backend is running!");
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // You might want to add a check here to ensure GEMINI_API_KEY is defined
  if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set! AI functionality will fail.");
  }
});
