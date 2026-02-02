The "Autonomous Intent Engine" Master Blueprint Prompt
Role: You are a Lead Systems Architect and Senior Full-Stack Engineer specializing in AI-Agentic systems. Objective: Carry forward the development of an "Autonomous Intent & Response Engine" using a modular NestJS backend, a Qdrant vector database, and Google Gemini.

1. Core System Architecture
Module A: The Semantic Crawler (Data Ingestion)

Build a service using Playwright that crawls a target website.

Logic: It must chunk the HTML into semantic sections (e.g., <section>, <div> with meaningful IDs).

Vectorization: Each chunk must be converted into embeddings using Gemini’s embedding model and stored in Qdrant.

Metadata: Store url, css_selector, raw_html, and semantic_description (AI-generated) as payloads.

Module B: Behavioral Analysis & RAG (The Brain)

Endpoint: Create a POST /api/v1/track endpoint in NestJS to receive detailed user interaction heartbeats.

RAG Flow: When a heartbeat arrives containing a current_selector or interaction_zone, perform a Similarity Search in Qdrant to find the exact business context of that HTML section.

Intent Scoring: Implement a logic that combines "Behavioral Signals" (dwell time, speed) + "Semantic Context" (e.g., user is looking at the 'Enterprise Pricing' section) to calculate an IntentScore.

Module C: Generative UI Engine (Action Layer)

Gemini Prompting: If IntentScore > Threshold, trigger Gemini to generate a response.

Constraint: Gemini must analyze the design pattern and styling of the retrieved HTML context to generate a matching UI overlay (HTML/CSS).

Output: The response must be a JSON object containing the injection_target_selector, html_payload, and scoped_css.

2. Technical Specifications & Best Practices
Modular Code: Use NestJS Modules (CrawlerModule, TrackingModule, AiGenerationModule) to keep concerns separated.

Real-time Safety: * Implement Shadow DOM for the injected UI to ensure no CSS leakage from the host site breaks the AI component.

Use a Validation Pipe to sanitize any AI-generated code before sending it to the client.

Frontend (Management Dashboard):

Build a Next.js dashboard where managers can:

Specify "System Prompts" (e.g., "If a user is hesitant on pricing, offer a 15-minute demo").

View live "Intent Streams" of users.

Configure tracking intervals and batch sizes.

3. Implementation Step-by-Step Instructions
Step 1: Implement the Qdrant Service with collection initialization and semantic search methods.

Step 2: Develop the Playwright Crawler to sync website structure with Qdrant.

Step 3: Create the Intent Logic that bridges the TrackingPayload with the QdrantSearch.

Step 4: Set up the Gemini Service using the @google/generative-ai SDK to generate the UI code.

Step 5: Build the Injection Handler in the JS Tracker to receive and safely render the AI components.