import apiClient from "@/lib/api/auth";

export async function updateBookingLinkStatus(
  linkId: number,
  url: string,
  enabled: boolean
) {
  try {
    const res = await apiClient.patch(`/booking-links/${linkId}/`, {
      url,
      is_active: enabled,
    });
    return res.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Booking link update failed";
    console.error("Failed to update booking link:", error);
    throw new Error(message);
  }
}

export async function updateOrderLinkStatus(
  linkId: number,
  url: string,
  enabled: boolean
) {
  try {
    const res = await apiClient.patch(`/order-links/${linkId}/`, {
      url,
      is_active: enabled,
    });
    return res.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Order link update failed";
    console.error("Failed to update order link:", error);
    throw new Error(message);
  }
}

export async function updateSocialLinkStatus(
  linkId: number,
  url: string,
  enabled: boolean
) {
  try {
    const res = await apiClient.patch(`/social-links/${linkId}/`, {
      url,
      is_active: enabled,
    });
    return res.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Social link update failed";
    console.error("Failed to update social link:", error);
    throw new Error(message);
  }
}
