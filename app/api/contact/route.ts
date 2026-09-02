import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: process.env.api_key,
        subject: `Portfolio message from ${name}`,
        from_name: "Portfolio Contact Form",
        name,
        email,
        message,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: result.message || "Something went wrong." },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Network error. Please try again." },
      { status: 500 }
    );
  }
}
