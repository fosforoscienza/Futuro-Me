import { NextResponse } from "next/server";

/**
 * Manual trigger for news fetching from the admin dashboard.
 * Same pipeline as the cron job, but triggered on demand.
 *
 * TODO: Add authentication check (NextAuth session)
 */
export async function POST(request: Request) {
  try {
    // TODO: Verify admin session via NextAuth
    // const session = await getServerSession(authOptions);
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Trigger the same pipeline as the cron job
    const cronUrl = new URL("/api/cron/fetch-news", request.url);
    const response = await fetch(cronUrl.toString(), {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET || "dev"}`,
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Manual news fetch triggered",
      result,
    });
  } catch (error) {
    console.error("Manual trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
