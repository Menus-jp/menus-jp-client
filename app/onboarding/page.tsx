"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBusinessApi } from "@/lib/hooks/useBusinessApi";
import { Step1Form } from "@/components/onboarding/step1-form";
import { Step2Form } from "@/components/onboarding/step2-form";
import { Step3Form } from "@/components/onboarding/step3-form";
import { Step4Form } from "@/components/onboarding/step4-form";
import { BusinessProfile, BookingLink, SocialLink } from "@/lib/types/business";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

function OnboardingContent() {
  const router = useRouter();
  const {
    loading,
    error,
    clearError,
    createBusiness,
    updateBusiness,
    publishBusiness,
    createBookingLink,
    createSocialLink,
    uploadPhoto,
  } = useBusinessApi();

  const [currentStep, setCurrentStep] = useState(1);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStep1Submit = async (data: {
    business_name: string;
    category: string;
    address?: string;
    phone_number?: string;
    heroImage?: File | null;
    latitude?: number;
    longitude?: number;
  }) => {
    try {
      clearError();
      const newBusiness = await createBusiness({
        business_name: data.business_name,
        category: data.category,
      });
      let merged = {
        ...newBusiness,
        category: data.category as BusinessProfile["category"],
      };

      const patch: Partial<BusinessProfile> = {};
      if (data.address) patch.address = data.address;
      if (data.phone_number) patch.phone_number = data.phone_number;
      if (data.latitude != null) patch.latitude = data.latitude;
      if (data.longitude != null) patch.longitude = data.longitude;
      if (Object.keys(patch).length > 0) {
        const updated = await updateBusiness(newBusiness.id, patch);
        merged = { ...merged, ...updated };
      }

      if (data.heroImage) {
        const fd = new FormData();
        fd.append("business", String(newBusiness.id));
        fd.append("image", data.heroImage);
        fd.append("is_hero", "true");
        fd.append("display_order", "0");
        await uploadPhoto(fd);
      }

      setBusiness(merged);
      setSuccessMessage("Business profile created!");
      setCurrentStep(2);
    } catch (err) {
      console.error("Step 1 error:", err);
    }
  };

  const handleStep2Submit = async (data: Partial<BusinessProfile>) => {
    if (!business) return;
    try {
      clearError();
      const updated = await updateBusiness(business.id, data);
      setBusiness((prev) => ({ ...prev!, ...updated }));
      setSuccessMessage("Contact information saved!");
      setCurrentStep(3);
    } catch (err) {
      console.error("Step 2 error:", err);
    }
  };

  const handleAddBookingLink = async (link: BookingLink) => {
    try {
      clearError();
      await createBookingLink({
        ...link,
        business: business?.id || 0,
      });
      setSuccessMessage("Booking link added!");
    } catch (err) {
      console.error("Booking link error:", err);
    }
  };

  const handleAddSocialLink = async (link: SocialLink) => {
    try {
      clearError();
      await createSocialLink({
        ...link,
        business: business?.id || 0,
      });
      setSuccessMessage("Social link added!");
    } catch (err) {
      console.error("Social link error:", err);
    }
  };

  const handleStep3Submit = async (data: Partial<BusinessProfile>) => {
    if (!business) return;
    try {
      clearError();
      const updated = await updateBusiness(business.id, data);
      setBusiness((prev) => ({ ...prev!, ...updated }));
      setSuccessMessage("Links configured!");
      setCurrentStep(4);
    } catch (err) {
      console.error("Step 3 error:", err);
    }
  };

  const handleStep4Submit = async (data: Partial<BusinessProfile>) => {
    if (!business) return;
    try {
      clearError();
      const updated = await updateBusiness(business.id, data);
      setBusiness((prev) => ({ ...prev!, ...updated }));
      setSuccessMessage("Plan selected!");

      await publishBusiness(business.id);
      setSuccessMessage("Business published successfully!");

      setTimeout(() => {
        router.push("/manage");
      }, 1500);
    } catch (err) {
      console.error("Step 4 error:", err);
    }
  };

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">menus.jp</div>
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <span className="text-sm">ヘルプ</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border border-gray-200 rounded-lg mt-8">
        {/* Header with Progress */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentStep === 1 && "ステップ1 : 店舗情報を入力"}
              {currentStep === 2 && "ステップ2 : 情報の確認・編集"}
              {currentStep === 3 && "ステップ3 : 予約サイトとSNS"}
              {currentStep === 4 && "ステップ4 : プランを選択"}
            </h1>
            <span className="text-sm font-semibold text-gray-600">
              {currentStep} / 4
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Headers */}
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {currentStep === 1 && "店舗を作成する"}
            {currentStep === 2 && "お店の情報を確認・編集してください"}
            {currentStep === 3 && "予約サイトとSNSを設定"}
            {currentStep === 4 && "プランを選択して公開"}
          </h2>
          <p className="text-sm text-gray-600">
            {currentStep === 1 && "基本的な店舗情報を入力してください"}
            {currentStep === 2 &&
              "Googleマップから取得した情報を元にしています"}
            {currentStep === 3 && "予約サイトやSNSのリンクを設定"}
            {currentStep === 4 && "ビジネスプランを選択して公開します"}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Container */}
        <div className="border border-gray-200 rounded-lg bg-white p-6 sm:p-8 shadow-sm">
          {/* Back Button */}
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-semibold"
            >
              ← 戻る / Back
            </button>
          )}

          {currentStep === 1 && (
            <Step1Form
              onSubmit={handleStep1Submit}
              loading={loading}
              error={error}
              currentBusiness={business}
            />
          )}

          {currentStep === 2 && business && (
            <Step2Form
              business={business}
              onSubmit={handleStep2Submit}
              loading={loading}
              error={error}
            />
          )}

          {currentStep === 3 && business && (
            <Step3Form
              business={business}
              onSubmit={handleStep3Submit}
              loading={loading}
              error={error}
            />
          )}

          {currentStep === 4 && business && (
            <Step4Form
              business={business}
              onSubmit={handleStep4Submit}
              onPublish={() => publishBusiness(business.id)}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
