#!/usr/bin/env node

/**
 * Simple test script to verify AI functionality
 * Run with: node test-ai.js
 */

const { GoogleGenAI } = require("@google/genai");

async function testAI() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  
  if (!apiKey) {
    console.log("❌ No API key found. Set GOOGLE_GENAI_API_KEY environment variable.");
    return;
  }

  console.log("🤖 Testing AI functionality...");
  
  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: "What is 2+2? Answer briefly."
        }]
      }]
    });

    console.log("✅ AI Test Successful!");
    console.log("Response:", response.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text");
    
  } catch (error) {
    console.log("❌ AI Test Failed:");
    console.log("Error:", error.message);
  }
}

testAI();
