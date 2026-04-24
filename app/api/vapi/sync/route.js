import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/utils/supabase';

// Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key",
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Find patients with a pending VAPI call (has ID, but no transcript)
    const { data: pendingCalls, error: fetchError } = await supabase
      .from('patients')
      .select('vapi_call_id')
      .not('vapi_call_id', 'is', null)
      .is('transcript', null);

    if (fetchError || !pendingCalls || pendingCalls.length === 0) {
      return NextResponse.json({ ok: true, message: "No pending calls to sync" });
    }

    if (!process.env.VAPI_API_KEY) {
       console.warn("VAPI_API_KEY is missing. Cannot fetch explicit call data.");
       return NextResponse.json({ error: "Missing Vapi credentials" }, { status: 500 });
    }

    const syncResults = [];

    // 2. Poll VAPI for each pending call
    for (const patient of pendingCalls) {
      const callId = patient.vapi_call_id;

      // Safe Check: Trap structural garbage payloads like "-" or missing keys directly
      if (!callId || callId.length < 5 || callId === "-") {
         console.warn(`Invalid vapi_call_id detected (${callId}). Clearing from sync queue.`);
         // Write a dummy string to transcript so the `.is('transcript', null)` stops executing on this!
         await supabase.from('patients').update({ transcript: "", sentiment: "Neutral" }).eq('vapi_call_id', callId);
         continue;
      }

      try {
        const vapiRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
          }
        });

        if (!vapiRes.ok) {
           console.error(`Failed to fetch Vapi call ${callId}: Status ${vapiRes.status}`);
           continue;
        }

        const callData = await vapiRes.json();

        // 3. Only process if the call has strictly 'ended'
        if (callData.status === "ended") {
           const transcript = callData.transcript || "No transcript provided";
           
           // Calculate duration safely based on provided timestamps
           let durationSeconds = 0;
           if (callData.startedAt && callData.endedAt) {
             durationSeconds = Math.round((new Date(callData.endedAt) - new Date(callData.startedAt)) / 1000);
           } else if (callData.durationMinutes) {
             durationSeconds = Math.round(callData.durationMinutes * 60);
           }

           // Analyze sentiment using OpenAI explicitly limited to enums
           let sentiment = "Neutral"; 
           if (transcript !== "No transcript provided" && process.env.OPENAI_API_KEY) {
             try {
               const aiResponse = await openai.chat.completions.create({
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
               
               const rawOutput = aiResponse.choices[0]?.message?.content?.trim();
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

           // Update the Supabase record safely locking in results
           const { error: updateErr } = await supabase
             .from('patients')
             .update({
               sentiment: sentiment,
               transcript: transcript,
               call_duration: durationSeconds
             })
             .eq('vapi_call_id', callId);

           if (updateErr) {
             console.error("Failed to commit synced VAPI data:", updateErr);
           } else {
             syncResults.push(`Call ${callId} Synced | Sentiment: ${sentiment}`);
           }
        }
      } catch (err) {
        console.error(`Error polling Vapi Call ${callId}`, err);
      }
    }

    return NextResponse.json({ ok: true, processed: syncResults.length, results: syncResults });
  } catch (err) {
    console.error("Global Sync Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
