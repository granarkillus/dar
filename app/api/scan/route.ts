import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let body: { image: string; mediaType: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { image, mediaType } = body;
  if (!image || !mediaType) {
    return NextResponse.json({ error: "Missing image or mediaType" }, { status: 400 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: image }
          },
          {
            type: "text",
            text: `This is an Allied Universal Daily Activity Report form. Extract all filled-in fields and return ONLY a valid JSON object with no preamble, explanation, or markdown code fences. Use exactly these keys:

{
  "officer_name": "",
  "date": "YYYY-MM-DD format if possible, otherwise as written, or empty string",
  "scheduled_shift": "",
  "shift_start": "",
  "shift_end": "",
  "received_radio": false,
  "received_pager": false,
  "received_keys": false,
  "received_detex": false,
  "activity_log": [
    { "from": "", "to": "", "activity": "" }
  ],
  "signature": ""
}

Rules:
- If a field is blank or illegible, use an empty string or false for booleans
- For checkboxes, use true if checked/marked, false if empty
- Include only activity log rows that have actual content written in them
- Return ONLY the JSON object, nothing else`
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.error?.message || "Claude API error" },
      { status: response.status }
    );
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
  if (!textBlock?.text) {
    return NextResponse.json({ error: "No response from Claude" }, { status: 500 });
  }

  try {
    const clean = textBlock.text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Claude returned an unexpected format. Try a clearer photo." },
      { status: 422 }
    );
  }
}
