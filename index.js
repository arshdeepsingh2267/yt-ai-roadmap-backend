import Groq from "groq-sdk";
import express from "express";
import cors from "cors";
import "dotenv/config";
const port = 5000;
const app = express();
app.use(cors());
app.use(express.json());
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function cleanAIResponse(content) {
  if (!content) return "";
  const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  const arrayMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (arrayMatch && arrayMatch[0]) {
    return arrayMatch[1].trim();
  }

  throw new Error("No valid JSON block found in response");
}

app.post("/api/generate-roadmap", async (req, res) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `You are an expert product strategist and professional roadmap architect with 15+ years of experience in tech project planning, stakeholder alignment, and Agile execution.
          Yur job is to generate the roadmap for: ${req.body.topic}.
          And, format as JSON array, Here is the sample structure {title:"XYZ",description:"Lorem Ipsem....",id:"1",estimated_time:"14 hours"}.
          Important Note: Kindly adhere to the JSON structure provided to you as sample structure.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    let aiContent = chatCompletion.choices[0]?.message?.content;

    console.log("RAW::::::", aiContent);

    const cleanedContent = await cleanAIResponse(aiContent);

    let roadmap;
    try {
      roadmap = await JSON.parse(cleanedContent);
      console.log("JSON:::", roadmap);
    } catch (jsonErr) {
      console.error("Failed to parse AI response as JSON:", jsonErr.message);
      return res.status(500).json({
        error: "AI response was not valid JSON.",
        message: jsonErr.message,
      });
    }
    res.json(roadmap);
  } catch (error) {
    console.log(error);
  }

  // Print the completion returned by the LLM.
  //   console.log(chatCompletion.choices[0]?.message?.content || "");
});

app.listen(port, "localhost", () => {
  console.log(`Example app listening on port ${port}`);
});
