// Backend to keep your API key safe
// Converted to ES Module syntax to resolve 'require is not defined' error

// Import statements for ES Modules
import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // node-fetch is needed if running outside a modern Node.js environment where fetch is global

const app = express();
const PORT = process.env.PORT || 3000; // Render sets process.env.PORT, typically to 10000

// IMPORTANT: Your Gemini API key MUST be set as an environment variable in Render.
// For example, in Render's dashboard for this service, under 'Environment' settings,
// add a new variable with Key: GEMINI_API_KEY and your actual API Key as its Value.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Middleware setup
app.use(cors()); // Enables Cross-Origin Resource Sharing for all origins (for development)
app.use(express.json()); // Parses incoming JSON requests

// Add a simple logger for all incoming requests to help debug routing
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
  next(); // Pass the request to the next middleware or route handler
});

// POST endpoint to handle requests to the Gemini API
app.post("/ask-gemini", async (req, res) => {
  console.log(`[${new Date().toISOString()}] /ask-gemini route hit! Attempting to call Gemini.`);
  if (!GEMINI_API_KEY) {
    console.error(`[${new Date().toISOString()}] ERROR: GEMINI_API_KEY is NOT set in environment variables! Cannot call Gemini API.`);
    return res.status(500).json({ error: "Server configuration error: Gemini API Key missing." });
  }

  try {
    const body = req.body; // The request body contains the chat history and generation config from the frontend
    console.log(`[${new Date().toISOString()}] Request body received for Gemini:`, JSON.stringify(body, null, 2));

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

    // Check if the response from Gemini was OK (2xx status code)
    if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${new Date().toISOString()}] ERROR: Gemini API responded with status ${response.status} ${response.statusText}`, errorData);
        return res.status(response.status).json({ error: "Gemini API error", details: errorData });
    }

    // Parse the JSON response from the Gemini API
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Gemini API response received.`);

    // Send the data received from the Gemini API back to the frontend
    res.json(data);
  } catch (error) {
    // Log the error for debugging purposes on the server side
    console.error(`[${new Date().toISOString()}] Uncaught error in /ask-gemini endpoint:`, error);
    // Send a 500 status code and an error message back to the frontend
    res.status(500).json({ error: "Failed to communicate with AI.", details: error.message });
  }
});

// Basic GET endpoint for health check or verification that the backend is running
app.get("/", (req, res) => {
  console.log(`[${new Date().toISOString()}] / route hit! Sending 'Gemini Backend is running!'.`);
  res.send("Gemini Backend is running!");
});

// Start the server and listen for incoming requests
const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
  // Check if GEMINI_API_KEY is defined immediately after server starts
  if (!GEMINI_API_KEY) {
    console.warn(`[${new Date().toISOString()}] WARNING: GEMINI_API_KEY is NOT set! AI functionality will fail.`);
  }
});

// --- Enhanced Error Handling for Server Startup ---

// Listen for 'error' events on the server itself, e.g., if port binding fails
server.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] FATAL SERVER ERROR: Failed to start server on port ${PORT}`, err);
  // Exit the process to allow Render to attempt a restart
  process.exit(1); 
});

// Catch unhandled promise rejections (async errors not caught by try/catch)
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] UNHANDLED REJECTION:`, reason);
  // Optionally, log the promise object itself
  // process.exit(1); // Consider exiting for critical unhandled rejections in production
});

// Catch uncaught exceptions (synchronous errors not caught by try/catch)
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] UNCAUGHT EXCEPTION:`, err);
  // This is a last resort. Log the error and gracefully exit.
  process.exit(1); 
});
