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

// Define interfaces for the gamified system
interface StudentProfile {
  stream: string; // Engineering, Science, Computer Science, etc.
  year: string; // 1st, 2nd, 3rd, 4th year
  interests: string[];
  skillLevel: string; // Beginner, Intermediate, Advanced
  preferredTechnologies: string[];
  teamSize: string; // Individual, Small Team (2-3), Large Team (4+)
  projectDuration: string; // 1-2 weeks, 1 month, 3 months, 6+ months
}

interface GameStep {
  stepId: number;
  question: string;
  options: string[];
  category: string;
  points: number;
}

interface ProjectIdea {
  title: string;
  overview: string;
  objectives: string[];
  technicalRequirements: {
    technologies: string[];
    skillsRequired: string[];
    difficulty: string;
  };
  projectStructure: {
    phases: Array<{
      name: string;
      duration: string;
      tasks: string[];
    }>;
  };
  deliverables: string[];
  learningOutcomes: string[];
  implementationGuide: {
    gettingStarted: string[];
    keyResources: string[];
    commonChallenges: string[];
  };
  variations: string[];
}

/**
 * Get gamification questions for context gathering
 */
export const getGameSteps = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { stepNumber } = request.data;
    
    const gameSteps: GameStep[] = [
      {
        stepId: 1,
        question: "What's your academic stream?",
        options: ["Computer Science/IT", "Electronics/ECE", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Biotechnology", "Pure Sciences", "Mathematics"],
        category: "stream",
        points: 10
      },
      {
        stepId: 2,
        question: "What's your current academic year?",
        options: ["1st Year (Freshman)", "2nd Year (Sophomore)", "3rd Year (Junior)", "4th Year (Senior)", "Graduate/Masters"],
        category: "year",
        points: 10
      },
      {
        stepId: 3,
        question: "What type of project excites you most?",
        options: ["Web/Mobile Applications", "AI/Machine Learning", "IoT/Hardware Projects", "Data Analysis/Visualization", "Game Development", "Automation/Robotics", "Research/Analysis", "Social Impact Projects"],
        category: "interests",
        points: 15
      },
      {
        stepId: 4,
        question: "How would you rate your programming/technical skills?",
        options: ["Beginner (Just starting)", "Intermediate (Some projects done)", "Advanced (Multiple complex projects)", "Expert (Teaching/Mentoring others)"],
        category: "skillLevel",
        points: 15
      },
      {
        stepId: 5,
        question: "What's your preferred team size?",
        options: ["Solo Project (Individual)", "Pair Programming (2 people)", "Small Team (3-4 people)", "Large Team (5+ people)"],
        category: "teamSize",
        points: 10
      },
      {
        stepId: 6,
        question: "How much time can you dedicate to this project?",
        options: ["Quick Sprint (1-2 weeks)", "Short Term (1 month)", "Medium Term (2-3 months)", "Long Term (6+ months)"],
        category: "projectDuration",
        points: 10
      },
      {
        stepId: 7,
        question: "Which technologies are you most comfortable with?",
        options: ["Python/Django/Flask", "JavaScript/React/Node.js", "Java/Spring", "C++/C", "Mobile (Android/iOS)", "Database (SQL/NoSQL)", "Cloud (AWS/Azure/GCP)", "No specific preference"],
        category: "preferredTechnologies",
        points: 20
      }
    ];

    if (stepNumber && stepNumber <= gameSteps.length) {
      return {
        success: true,
        step: gameSteps[stepNumber - 1],
        totalSteps: gameSteps.length,
        isLastStep: stepNumber === gameSteps.length
      };
    }

    return {
      success: true,
      steps: gameSteps,
      totalSteps: gameSteps.length
    };
  } catch (error) {
    logger.error("Error getting game steps:", error);
    throw new Error(`Failed to get game steps: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Generate comprehensive project idea based on gamified context
 */
export const generateIdea = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { query, studentProfile, gameResponses } = request.data;
    
    if (!query || typeof query !== "string") {
      throw new Error("Invalid query parameter");
    }

    logger.info("Generating comprehensive idea for:", { query, studentProfile });

    // Build context-rich prompt
    const contextPrompt = `
You are an expert educational project advisor for ${studentProfile?.stream || 'engineering'} students.

Student Context:
- Academic Stream: ${studentProfile?.stream || 'Not specified'}
- Year: ${studentProfile?.year || 'Not specified'}
- Skill Level: ${studentProfile?.skillLevel || 'Intermediate'}
- Interests: ${studentProfile?.interests?.join(', ') || 'General'}
- Preferred Technologies: ${studentProfile?.preferredTechnologies?.join(', ') || 'Flexible'}
- Team Size: ${studentProfile?.teamSize || 'Individual'}
- Project Duration: ${studentProfile?.projectDuration || '1-2 months'}

Project Query: ${query}

Generate a comprehensive project idea that follows this EXACT structure:

## PROJECT TITLE
[Creative, specific title]

## PROJECT OVERVIEW
[2-3 sentence description of what the project does and its purpose]

## LEARNING OBJECTIVES
[3-4 specific learning goals the student will achieve]

## TECHNICAL REQUIREMENTS
### Technologies Needed:
[List of specific technologies, frameworks, tools]

### Skills Required:
[List of technical and soft skills needed]

### Difficulty Level:
[Beginner/Intermediate/Advanced with brief justification]

## PROJECT STRUCTURE
### Phase 1: Planning & Setup (Week 1)
[Specific tasks for initial phase]

### Phase 2: Core Development (Weeks 2-X)
[Main development tasks]

### Phase 3: Testing & Refinement (Final Week)
[Testing, debugging, documentation tasks]

## KEY DELIVERABLES
[List of specific outputs/artifacts the student will create]

## IMPLEMENTATION GUIDE
### Getting Started:
[Step-by-step initial setup instructions]

### Key Resources:
[Specific tutorials, documentation, tools]

### Common Challenges & Solutions:
[Anticipated problems and how to solve them]

## LEARNING OUTCOMES
[What the student will know/be able to do after completion]

## PROJECT VARIATIONS
### Beginner Version:
[Simplified version if needed]

### Advanced Extensions:
[Ways to expand the project for advanced students]

Ensure the project is:
1. Appropriate for ${studentProfile?.skillLevel || 'intermediate'} level
2. Completable in ${studentProfile?.projectDuration || '1-2 months'}
3. Suitable for ${studentProfile?.teamSize || 'individual work'}
4. Uses technologies the student prefers: ${studentProfile?.preferredTechnologies?.join(', ') || 'flexible technologies'}
5. Relevant to ${studentProfile?.stream || 'engineering'} curriculum
`;
    
    // Using the gemini model with genkit
    const ai = genkit({
      plugins: [googleAI({
        apiKey: process.env.GEMINI_API_KEY || ""
      })],
      model: googleAI.model('gemini-2.5-flash'),
    });
    
    const { text } = await ai.generate(contextPrompt);
    
    logger.info("Successfully generated comprehensive idea");

    // Return the generated idea with metadata
    return {
      success: true,
      idea: text,
      metadata: {
        generatedAt: new Date().toISOString(),
        studentProfile,
        query,
        gameResponses
      }
    };
  } catch (error) {
    logger.error("Error generating idea:", error);
    throw new Error(`Failed to generate idea: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Save user's project idea to history
 */
export const saveIdeaToHistory = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { userId, ideaData, gameSteps } = request.data;
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    // In a real implementation, you would save to Firestore
    // For now, we'll return success to indicate the structure
    logger.info("Saving idea to history for user:", userId);

    return {
      success: true,
      historyId: `history_${Date.now()}`,
      message: "Idea saved to history successfully"
    };
  } catch (error) {
    logger.error("Error saving idea to history:", error);
    throw new Error(`Failed to save idea: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get user's project idea history
 */
export const getUserHistory = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { userId } = request.data;
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    logger.info("Getting history for user:", userId);

    // In a real implementation, you would fetch from Firestore
    // For now, return a sample structure
    return {
      success: true,
      history: [
        {
          id: "sample_1",
          query: "Sample project query",
          generatedAt: new Date().toISOString(),
          gameScore: 85,
          studentProfile: {
            stream: "Computer Science",
            year: "3rd Year",
            skillLevel: "Intermediate"
          }
        }
      ],
      totalProjects: 1
    };
  } catch (error) {
    logger.error("Error getting user history:", error);
    throw new Error(`Failed to get history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
