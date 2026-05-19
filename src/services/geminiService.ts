import { GoogleGenAI, Type } from "@google/genai";
import { AppSettings, PROVIDERS } from "../constants/providers";

export enum ExplainMode {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  SENIOR = "Senior Engineer",
  INTERVIEW = "Interview Preparation",
  SECURITY = "Security Audit",
  PERFORMANCE = "Performance Optimization"
}

export interface AnalysisStep {
  lineNumber: number;
  code: string;
  explanation: string;
  intent: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  optimizationSuggestion?: string;
  relatedConcepts: string[];
  confidenceScore: number;
}

export interface AnalysisResult {
  steps: AnalysisStep[];
  overview: string;
  complexityScore: number;
  maintainabilityObservations: string[];
  architecturalObservations: string[];
  providerUsed?: string;
}

export async function testProvider(providerId: string, apiKey: string): Promise<{ status: string, latency: number }> {
  const start = Date.now();
  try {
    if (providerId === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "Respond with 'ok'",
        config: { maxOutputTokens: 5 }
      });
      if (response.text) return { status: 'healthy', latency: Date.now() - start };
    } else {
      const provider = PROVIDERS.find(p => p.id === providerId);
      if (!provider?.endpoint) throw new Error("No endpoint");
      
      const res = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: providerId === 'groq' ? "llama-3.1-8b-instant" : (providerId === 'openrouter' ? "google/gemini-2.0-flash-001" : "test"),
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5
        })
      });
      if (res.ok) return { status: 'healthy', latency: Date.now() - start };
      if (res.status === 429) return { status: 'quota_limited', latency: Date.now() - start };
      return { status: 'invalid_key', latency: Date.now() - start };
    }
  } catch (e) {
    return { status: 'offline', latency: Date.now() - start };
  }
  return { status: 'offline', latency: Date.now() - start };
}

export async function fetchAnalysis(
  code: string, 
  mode: ExplainMode, 
  metadata: any, 
  settings: AppSettings,
  onProviderSwitch?: (providerId: string) => void
): Promise<AnalysisResult> {
  const providersToTry = [settings.preferredProvider, ...PROVIDERS.map(p => p.id).filter(id => id !== settings.preferredProvider)];
  
  let lastError = null;

  for (const providerId of providersToTry) {
    const pState = settings.providers[providerId];
    if (!pState?.enabled || !pState.apiKey) continue;

    if (providerId !== settings.preferredProvider && onProviderSwitch) {
      onProviderSwitch(providerId);
    }

    try {
      const result = await executeAnalysis(providerId, pState.apiKey, code, mode, metadata);
      return { ...result, providerUsed: providerId };
    } catch (error: any) {
      console.warn(`Provider ${providerId} failed:`, error);
      lastError = error;
      if (!settings.autoFallback) break;
    }
  }

  throw lastError || new Error("No providers available or configured.");
}

async function executeAnalysis(providerId: string, apiKey: string, code: string, mode: ExplainMode, metadata: any): Promise<AnalysisResult> {
  const prompt = `
    Analyze this code from the perspective of a ${mode}.
    Structure Context (AST):
    - Functions: ${metadata.functions.join(', ')}
    - Classes: ${metadata.classes.join(', ')}
    - Imports: ${metadata.imports.join(', ')}
    - Complexity Index: ${metadata.complexity}

    RETURN A JSON OBJECT WITH THIS STRUCTURE:
    {
      "steps": [
        {
          "lineNumber": number,
          "code": "string",
          "explanation": "string depth appropriate for ${mode}",
          "intent": "what is this line trying to achieve?",
          "riskLevel": "Low" | "Medium" | "High" | "Critical",
          "optimizationSuggestion": "optional string",
          "relatedConcepts": ["string"],
          "confidenceScore": number (0-1)
        }
      ],
      "overview": "High level summary of the code's purpose from ${mode} perspective",
      "complexityScore": number 1-100,
      "maintainabilityObservations": ["string"],
      "architecturalObservations": ["string"]
    }

    CODE TO ANALYZE:
    ${code}
  `;

  if (providerId === 'gemini') {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  lineNumber: { type: Type.NUMBER },
                  code: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  intent: { type: Type.STRING },
                  riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                  optimizationSuggestion: { type: Type.STRING },
                  relatedConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ["lineNumber", "code", "explanation", "intent", "riskLevel", "relatedConcepts", "confidenceScore"]
              }
            },
            overview: { type: Type.STRING },
            complexityScore: { type: Type.NUMBER },
            maintainabilityObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
            architecturalObservations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["steps", "overview", "complexityScore", "maintainabilityObservations", "architecturalObservations"]
        }
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(response.text.trim());
  } else {
    // OpenAI fallback for others
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider?.endpoint) throw new Error("Endpoint not configured");

    const res = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: providerId === 'groq' ? "llama-3.1-70b-versatile" : (providerId === 'openrouter' ? "google/gemini-2.0-flash-001" : "default"),
        messages: [
          { role: "system", content: "You are a code intelligence engine. Always output valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) throw new Error(`Provider failed with status ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  }
}
