import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/business/delete
 * Deletes a business by ID.
 * Expects: { businessId: number }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    const token = request.headers.get("authorization")?.replace("Bearer ", "") ||
                  request.headers.get("authorization")?.replace("Token ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8005/api";
    const response = await fetch(`${apiBaseUrl}/businesses/${businessId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.detail || errorData.message || "Failed to delete business",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: "Business deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
