import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/utils/supabase';

// Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key",
});

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const callId = body.call_id;

    if (!callId) {
       return NextResponse.json({ error: "Missing call_id parameter in payload" }, { status: 400 });
    }

    if (!process.env.VAPI_API_KEY) {
       console.warn("VAPI_API_KEY is missing. Cannot fetch explicit call data.");
       return NextResponse.json({ error: "Missing Vapi credentials" }, { status: 500 });
    }

    // 1. Locate the absolute most recently created Patient
    const { data: latestPatients, error: fetchErr } = await supabase
       .from('patients')
       .select('id, created_at')
       .order('created_at', { ascending: false })
       .limit(1);

    if (fetchErr || !latestPatients || latestPatients.length === 0) {
       return NextResponse.json({ error: "No patients found in database to link call against." }, { status: 404 });
    }

    const patientId = latestPatients[0].id;

    // 2. Fetch the Call from VAPI synchronously
    const vapiRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
       method: 'GET',
       headers: { 'Authorization': `Bearer ${process.env.VAPI_API_KEY}` }
    });

    if (!vapiRes.ok) {
       // Bind the Call ID structurally but log the error if VAPI rejects it so it doesn't break CRM association
       await supabase.from('patients').update({ vapi_call_id: callId, transcript: "", sentiment: "Neutral" }).eq('id', patientId);
       return NextResponse.json({ error: "Failed to validate call actively from VAPI, but ID mapped securely as a neutral fallback", patientLinked: patientId }, { status: 206 });
    }

    const callData = await vapiRes.json();
    const rawTranscript = callData.transcript || "No transcript provided";
    const transcript = rawTranscript.replaceAll("AI:", "Katia:");
    const recordingUrl = callData.recordingUrl || null;
    
    let durationSeconds = 0;
    if (callData.startedAt && callData.endedAt) {
      durationSeconds = Math.round((new Date(callData.endedAt) - new Date(callData.startedAt)) / 1000);
    } else if (callData.durationMinutes) {
      durationSeconds = Math.round(callData.durationMinutes * 60);
    }

    // 3. Process Sentiment Generation natively
    let sentiment = "Neutral"; 
    if (transcript !== "No transcript provided" && process.env.OPENAI_API_KEY) {
       try {
         const aiResponse = await openai.chat.completions.create({
           model: "gpt-4o-mini",
           messages: [
             {
               role: "system",
               content: "You are an analytical sentiment classifier. Read the transcript and respond with EXACTLY ONE of the following words describing the caller's overall emotional state: Satisfied, Frustrated, Neutral, Angry. Do not provide any other text."
             },
             {
               role: "user",
               content: transcript
             }
           ],
           temperature: 0,
           max_tokens: 10
         });
         
         const rawOutput = aiResponse.choices[0]?.message?.content?.trim();
         const validSentiments = ["Satisfied", "Frustrated", "Neutral", "Angry"];
         
         if (validSentiments.includes(rawOutput)) {
           sentiment = rawOutput;
         } else {
           const found = validSentiments.find(s => rawOutput.includes(s));
           if (found) sentiment = found;
         }
       } catch (err) {}
    }

    // 4. Actively Commit All Telemetry & Webhook assignments into the explicit latest Patient row
    const { error: updateErr } = await supabase
       .from('patients')
       .update({
         vapi_call_id: callId,
         recording_url: recordingUrl,
         sentiment: sentiment,
         transcript: transcript,
         call_duration: durationSeconds
       })
       .eq('id', patientId);

    if (updateErr) {
       return NextResponse.json({ error: "Failed locking pipeline properties to absolute database constraint", details: updateErr }, { status: 500 });
    }

    return NextResponse.json({ ok: true, linked: true, target_patient_id: patientId, sentiment_resolved: sentiment });

  } catch (err) {
    console.error("Link Call Fatal Error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
