"use client";

import { useState, useCallback } from "react";
import apiClient from "@/lib/api/auth";
import { timeToISODatetime, extractErrorMessage } from "@/lib/utils";
import {
  BusinessProfile,
  BusinessInfo,
  BusinessHours,
  BulkHoursEntry,
  BusinessPhoto,
  MenuCategory,
  MenuItem,
  MenuItemPhoto,
  MenuItemHours,
  ServiceItem,
  BookingLink,
  SocialLink,
  ClosedDay,
  BusinessDetail,
} from "@/lib/types/business";

export function useBusinessApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/businesses/");
      return res.data;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load businesses"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBusinessById = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/businesses/${id}/`);
      return res.data as BusinessDetail;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load business"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listBusinessInfo = useCallback(async (businessId?: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get("/business-info/", {
        params: businessId ? { business: businessId } : undefined,
      });
      return res.data as BusinessInfo[] | BusinessInfo;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load business info"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBusinessInfo = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get("/business-info/", {
        params: { business: businessId },
      });
      return res.data as BusinessInfo;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load business info"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBusinessInfoById = useCallback(async (infoId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/business-info/${infoId}/`);
      return res.data as BusinessInfo;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load business info"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBusiness = useCallback(
    async (data: {
      business_name: string;
      category: string;
      address?: string;
      phone_number?: string;
      latitude?: number;
      longitude?: number;
      hero_image?: File | null;
    }) => {
      try {
        setLoading(true);
        const fd = new FormData();
        fd.append("business_name", data.business_name);
        fd.append("category", data.category);
        if (data.address) fd.append("address", data.address);
        if (data.phone_number) fd.append("phone_number", data.phone_number);
        if (data.latitude != null) fd.append("latitude", String(data.latitude));
        if (data.longitude != null) fd.append("longitude", String(data.longitude));
        if (data.hero_image) fd.append("hero_image", data.hero_image);
        const res = await apiClient.post("/businesses/", fd, {
          headers: { "Content-Type": undefined },
        });
        return res.data as BusinessProfile;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to create business"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  type BusinessPatch = Omit<Partial<BusinessProfile>, "hero_image" | "logo"> & { hero_image?: File | null; logo?: File | null };
  type BusinessInfoPatch = {
    description_jp?: string | null;
    description_en?: string | null;
    seating_capacity?: number | null;
  };

  const updateBusiness = useCallback(
    async (id: number, data: BusinessPatch) => {
      try {
        setLoading(true);
        const fd = new FormData();
        if (data.business_name) fd.append("business_name", data.business_name);
        if (data.category) fd.append("category", data.category);
        if (data.address) fd.append("address", data.address);
        if (data.phone_number) fd.append("phone_number", data.phone_number);
        if (data.website) fd.append("website", data.website);
        if (data.maps_url) fd.append("maps_url", data.maps_url);
        if (data.latitude != null) fd.append("latitude", String(data.latitude));
        if (data.longitude != null) fd.append("longitude", String(data.longitude));
        if (data.hero_image) fd.append("hero_image", data.hero_image);
        if (data.logo) fd.append("logo", data.logo);
        const res = await apiClient.patch(`/businesses/${id}/`, fd, {
          headers: { "Content-Type": undefined },
        });
        return res.data as BusinessProfile;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update business"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateBusinessInfo = useCallback(
    async (businessId: number, data: BusinessInfoPatch) => {
      try {
        setLoading(true);
        const res = await apiClient.patch("/business-info/", data, {
          params: { business: businessId },
        });
        return res.data as BusinessInfo;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update business info"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateBusinessInfoById = useCallback(
    async (infoId: number, data: BusinessInfoPatch) => {
      try {
        setLoading(true);
        const res = await apiClient.patch(`/business-info/${infoId}/`, data);
        return res.data as BusinessInfo;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update business info"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const publishBusiness = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const res = await apiClient.post(`/businesses/${id}/publish/`, {});
      return res.data;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to publish business"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unpublishBusiness = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const res = await apiClient.post(`/businesses/${id}/unpublish/`, {});
      return res.data;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to unpublish business"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBusiness = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/businesses/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete business"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Business Hours ──────────────────────────────────────────────────────────
  const listBusinessHours = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/business-hours/?business=${businessId}`,
      );
      return (res.data.results ?? res.data) as BusinessHours[];
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load hours"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** POST /api/business-hours/bulk_create/ */
  const bulkCreateBusinessHours = useCallback(
    async (businessId: number, hours: BulkHoursEntry[]) => {
      try {
        setLoading(true);
        const res = await apiClient.post("/business-hours/bulk_create/", {
          business: businessId,
          hours,
        });
        return res.data;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to save hours"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /** PATCH /api/business-hours/bulk_update/ — each entry must include `id` */
  const bulkUpdateBusinessHours = useCallback(
    async (
      businessId: number,
      hours: Array<Partial<BusinessHours> & { id: number }>,
    ) => {
      try {
        setLoading(true);
        const res = await apiClient.patch("/business-hours/bulk_update/", {
          business: businessId,
          hours,
        });
        return res.data;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update hours"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteBusinessHours = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/business-hours/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete hours"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Closed Days ─────────────────────────────────────────────────────────────
  const listClosedDays = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/closed-days/?business=${businessId}`);
      return (res.data.results ?? res.data) as ClosedDay[];
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load closed days"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkCreateClosedDays = useCallback(
    async (
      businessId: number,
      closedDays: Array<{ day_of_week: string; reason?: string }>,
    ) => {
      try {
        setLoading(true);
        const res = await apiClient.post("/closed-days/bulk_create/", {
          business: businessId,
          closed_days: closedDays,
        });
        return res.data;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to create closed days"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteClosedDay = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/closed-days/${id}/`);
    } catch (err: any) {
      // 404 means the record is already gone — treat as success
      if (err?.response?.status === 404) return;
      setError(extractErrorMessage(err, "Failed to delete closed day"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Menu Items ──────────────────────────────────────────────────────────────
  const listMenuItems = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/menu-items/?business=${businessId}`);
      return (res.data.results ?? res.data) as MenuItem[];
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load menu items"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * POST /api/menu-items/ — multipart/form-data.
   * category_jp / category_en are free-text strings.
   * photo_images[] and photo_labels[] are aligned by index.
   */
  const createMenuItem = useCallback(async (formData: FormData) => {
    try {
      setLoading(true);
      const res = await apiClient.post("/menu-items/", formData, {
        headers: { "Content-Type": undefined },
      });
      return res.data as MenuItem;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to create menu item"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMenuItem = useCallback(
    async (
      id: number,
      data: {
        category_jp?: string;
        category_en?: string;
        discount_percentage?: string | null;
        discount_start_time?: string | null;
        discount_end_time?: string | null;
      },
    ) => {
      try {
        setLoading(true);
        // Send as FormData — the backend view uses QueryDict.getlist() which requires multipart
        const fd = new FormData();
        if (data.category_jp !== undefined)
          fd.append("category_jp", data.category_jp ?? "");
        if (data.category_en !== undefined)
          fd.append("category_en", data.category_en ?? "");
        if (data.discount_percentage !== undefined)
          fd.append("discount_percentage", data.discount_percentage ?? "");
        if (data.discount_start_time !== undefined)
          fd.append("discount_start_time", timeToISODatetime(data.discount_start_time) ?? "");
        if (data.discount_end_time !== undefined)
          fd.append("discount_end_time", timeToISODatetime(data.discount_end_time) ?? "");
        const res = await apiClient.patch(`/menu-items/${id}/`, fd, {
          headers: { "Content-Type": undefined },
        });
        return res.data as MenuItem;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update menu item"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteMenuItem = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/menu-items/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete menu item"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Menu Item Photos ────────────────────────────────────────────────────────
  const uploadMenuItemPhoto = useCallback(async (formData: FormData) => {
    try {
      setLoading(true);
      const res = await apiClient.post("/menu-item-photos/", formData, {
        headers: { "Content-Type": undefined },
      });
      return res.data as MenuItemPhoto;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to upload menu item photo"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMenuItemPhoto = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/menu-item-photos/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete menu item photo"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Menu Item Hours ──────────────────────────────────────────────────────────
  const bulkCreateMenuItemHours = useCallback(
    async (
      menuItemId: number,
      hours: Array<{
        day_of_week: string;
        is_closed: boolean;
        closed_reason?: string;
        start_time?: string;
        end_time?: string;
      }>,
    ) => {
      try {
        setLoading(true);
        const res = await apiClient.post("/menu-item-hours/bulk_create/", {
          menu_item: menuItemId,
          hours,
        });
        return res.data;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to create menu item hours"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const bulkUpdateMenuItemHours = useCallback(
    async (hours: Array<Partial<MenuItemHours> & { id: number }>) => {
      try {
        setLoading(true);
        const res = await apiClient.patch("/menu-item-hours/bulk_update/", {
          hours,
        });
        return res.data;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update menu item hours"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteMenuItemHours = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/menu-item-hours/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete menu item hours"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Service Items ───────────────────────────────────────────────────────────
  const listServiceItems = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/service-items/?business=${businessId}`);
      return (res.data.results ?? res.data) as ServiceItem[];
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load service items"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createServiceItem = useCallback(async (formData: FormData) => {
    try {
      setLoading(true);
      const res = await apiClient.post("/service-items/", formData, {
        headers: { "Content-Type": undefined },
      });
      return res.data as ServiceItem;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to create service item"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateServiceItem = useCallback(
    async (id: number, data: Partial<ServiceItem>) => {
      try {
        setLoading(true);
        const res = await apiClient.patch(`/service-items/${id}/`, data);
        return res.data as ServiceItem;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update service item"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteServiceItem = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/service-items/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete service item"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Booking Links ───────────────────────────────────────────────────────────
  const listBookingLinks = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/booking-links/?business=${businessId}`);
      return (res.data.results ?? res.data) as BookingLink[];
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load booking links"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBookingLink = useCallback(
    async (data: Omit<BookingLink, "id" | "created_at" | "updated_at">) => {
      try {
        setLoading(true);
        const res = await apiClient.post("/booking-links/", data);
        return res.data as BookingLink;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to create booking link"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateBookingLink = useCallback(
    async (id: number, data: Partial<BookingLink>) => {
      try {
        setLoading(true);
        const res = await apiClient.patch(`/booking-links/${id}/`, data);
        return res.data as BookingLink;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update booking link"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteBookingLink = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/booking-links/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete booking link"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Social Links ────────────────────────────────────────────────────────────
  const listSocialLinks = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/social-links/?business=${businessId}`);
      return (res.data.results ?? res.data) as SocialLink[];
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load social links"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSocialLink = useCallback(
    async (data: Omit<SocialLink, "id" | "created_at" | "updated_at">) => {
      try {
        setLoading(true);
        const res = await apiClient.post("/social-links/", data);
        return res.data as SocialLink;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to create social link"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateSocialLink = useCallback(
    async (id: number, data: Partial<SocialLink>) => {
      try {
        setLoading(true);
        const res = await apiClient.patch(`/social-links/${id}/`, data);
        return res.data as SocialLink;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update social link"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteSocialLink = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/social-links/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete social link"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Business Photos ─────────────────────────────────────────────────────────
  const listPhotos = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/business-photos/?business=${businessId}`,
      );
      return (res.data.results ?? res.data) as BusinessPhoto[];
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load photos"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadPhoto = useCallback(async (formData: FormData) => {
    try {
      setLoading(true);
      const res = await apiClient.post("/business-photos/", formData, {
        headers: { "Content-Type": undefined },
      });
      return res.data as BusinessPhoto;
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to upload photo"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePhoto = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/business-photos/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete photo"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

    // ── Order Links ─────────────────────────────────────────────────────────
  const listOrderLinks = useCallback(async (businessId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/order-links/?business=${businessId}`);
      return (res.data.results ?? res.data) as import("@/lib/types/business").OrderLink[];
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load order links"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrderLink = useCallback(
    async (data: Omit<import("@/lib/types/business").OrderLink, "id" | "created_at" | "updated_at">) => {
      try {
        setLoading(true);
        const res = await apiClient.post("/order-links/", data);
        return res.data as import("@/lib/types/business").OrderLink;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to create order link"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateOrderLink = useCallback(
    async (id: number, data: Partial<import("@/lib/types/business").OrderLink>) => {
      try {
        setLoading(true);
        const res = await apiClient.patch(`/order-links/${id}/`, data);
        return res.data as import("@/lib/types/business").OrderLink;
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update order link"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteOrderLink = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/order-links/${id}/`);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete order link"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    clearError,
    // Business
    listBusinesses,
    getBusinessById,
    listBusinessInfo,
    getBusinessInfo,
    getBusinessInfoById,
    createBusiness,
    updateBusiness,
    updateBusinessInfo,
    updateBusinessInfoById,
    publishBusiness,
    unpublishBusiness,
    deleteBusiness,
    // Hours
    listBusinessHours,
    bulkCreateBusinessHours,
    bulkUpdateBusinessHours,
    deleteBusinessHours,
    // Closed Days
    listClosedDays,
    bulkCreateClosedDays,
    deleteClosedDay,
    // Menu Categories
    // (removed — categories are now free-text fields on menu items)
    // Menu Items
    listMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    // Menu Item Photos
    uploadMenuItemPhoto,
    deleteMenuItemPhoto,
    // Menu Item Hours
    bulkCreateMenuItemHours,
    bulkUpdateMenuItemHours,
    deleteMenuItemHours,
    // Service Items
    listServiceItems,
    createServiceItem,
    updateServiceItem,
    deleteServiceItem,
    // Booking Links
    listBookingLinks,
    createBookingLink,
    updateBookingLink,
    deleteBookingLink,
    // Social Links
    listSocialLinks,
    createSocialLink,
    updateSocialLink,
    deleteSocialLink,
    // Business Photos
    listPhotos,
    uploadPhoto,
    deletePhoto,
    // Order Links
    listOrderLinks,
    createOrderLink,
    updateOrderLink,
    deleteOrderLink,
  };
}
