import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/utils/supabase';

// Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key",
});

export async function POST(request) {
  try {
    const body = await request.json();
    const msg = body.message;

    if (msg?.type === "end-of-call-report") {
      const call = msg.call;

      if (!call?.id) {
        console.log("Ignored VAPI webhook: No call ID provided.");
        return NextResponse.json({ ok: true, ignored: true });
      }

      const transcript = msg.artifact?.transcript || "No transcript provided";
      
      // Calculate call duration in seconds
      let durationSeconds = 0;
      if (call?.startedAt && call?.endedAt) {
        durationSeconds = Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000);
      }

      // Analyze sentiment using OpenAI explicitly limited to enums
      let sentiment = "Neutral"; // Default
      if (transcript !== "No transcript provided" && process.env.OPENAI_API_KEY) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are an analytical sentiment classifier. Read the transcript and respond with EXACTLY ONE of the following words describing the caller's overall emotional state: Satisfied, Confused, Frustrated, Delighted, Neutral, Angry. Do not provide any other text."
              },
              {
                role: "user",
                content: transcript
              }
            ],
            temperature: 0,
            max_tokens: 10
          });
          
          const rawOutput = response.choices[0]?.message?.content?.trim();
          const validSentiments = ["Satisfied", "Confused", "Frustrated", "Delighted", "Neutral", "Angry"];
          
          if (validSentiments.includes(rawOutput)) {
            sentiment = rawOutput;
          } else {
             const found = validSentiments.find(s => rawOutput.includes(s));
             if (found) sentiment = found;
          }
        } catch (openaiErr) {
          console.error("OpenAI analysis failed:", openaiErr);
        }
      }

      // Update Supabase record where vapi_call_id matches this call ID
      if (call?.id) {
        const { data, error } = await supabase
          .from('patients')
          .update({
            sentiment: sentiment,
            transcript: transcript,
            call_duration: durationSeconds
          })
          .eq('vapi_call_id', call.id);

        if (error) {
          console.error("Failed to update patient with call data:", error);
        }
      }

      console.log(`Processed Call ${call?.id} | Sentiment: ${sentiment} | Duration: ${durationSeconds}s`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to parse VAPI webhook payload:", error);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
