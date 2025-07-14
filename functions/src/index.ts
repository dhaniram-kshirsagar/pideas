/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
// Import genkit and googleAI plugin
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Initialize Gemini API client
// You will need to set the GEMINI_API_KEY in your Firebase functions config
// You'll need to set this API key in Firebase config using:
// firebase functions:config:set gemini.key="YOUR_API_KEY"

/**
 * Cloud Function that generates project ideas using Google's Gemini AI model
 */
export const generateIdea = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const query = request.data.query;
    
    if (!query || typeof query !== "string") {
      throw new Error("Invalid query parameter");
    }

    logger.info("Generating idea for query:", query);

    // Generate content using the Gemini model
    const prompt = `Generate a project idea based on this query: ${query}. 
    Make it detailed, creative and practical. Include possible technologies 
    to implement it with and a brief overview of the project structure.`;
    
    // Using the gemini model with genkit
    const ai = genkit({
      plugins: [googleAI({
        apiKey: process.env.GEMINI_API_KEY || ""
      })],
      model: googleAI.model('gemini-2.5-flash'),
    });
    
    const { text } = await ai.generate(prompt);
    
    logger.info("Successfully generated idea");

    // Return the generated idea
    return {
      success: true,
      idea: text,
    };
  } catch (error) {
    logger.error("Error generating idea:", error);
    throw new Error(`Failed to generate idea: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
