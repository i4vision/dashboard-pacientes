import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const msg = body.message;

    if (msg?.type === "end-of-call-report") {
      const call = msg.call;

      // length: pull from the completed call record you receive/store
      // sentiment: read from call.analysis.structuredData
      // or from your transcriber/provider output if configured

      console.log({
        callId: call?.id,
        endedReason: msg.endedReason,
        transcript: msg.artifact?.transcript,
        analysis: call?.analysis
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to parse VAPI webhook payload:", error);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
