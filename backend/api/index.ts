// Vercel's Node.js serverless entrypoint — any file under api/ becomes a function, and
// Vercel's Node runtime knows how to invoke an exported Express app directly as the request
// handler (no .listen() involved). See backend/vercel.json for the rewrite that routes
// every request to this one function, and src/app.ts for the actual app it wraps.
import app from "../src/app.js";

export default app;
