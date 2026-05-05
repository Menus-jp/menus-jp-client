"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBusinessApi } from "@/lib/hooks/useBusinessApi";
import { Step1Form } from "@/components/onboarding/step1-form";
import { Step2Form } from "@/components/onboarding/step2-form";
import { Step3Form } from "@/components/onboarding/step3-form";
import { Step4Form } from "@/components/onboarding/step4-form";
import { BusinessProfile } from "@/lib/types/business";
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
    updateBusinessInfo,
    publishBusiness,
    uploadPhoto,
    listPhotos,
    deletePhoto,
  } = useBusinessApi();

  const [currentStep, setCurrentStep] = useState(1);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isNewBusiness, setIsNewBusiness] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");;

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

type BusinessPatch = Omit<Partial<BusinessProfile>, "hero_image" | "logo"> & { hero_image?: File | null; logo?: File | null };

  const handleStep1Submit = async (data: {
    business_name: string;
    category: string;
    address?: string;
    phone_number?: string;
    description_jp?: string;
    description_en?: string;
    seating_capacity?: number;
    hero_image?: File | null;
    logo?: File | null;
    latitude?: number;
    longitude?: number;
  }) => {
    try {
      clearError();


      if (business) {
        const patch: BusinessPatch = {
          business_name: data.business_name,
          category: data.category as BusinessProfile["category"],
          address: data.address,
          phone_number: data.phone_number,
          latitude: data.latitude,
          longitude: data.longitude,
          ...(data.hero_image ? { hero_image: data.hero_image } : {}),
          ...(data.logo ? { logo: data.logo } : {}),
        };
        const updated = await updateBusiness(business.id, patch);
        const info = await updateBusinessInfo(business.id, {
          description_jp: data.description_jp?.trim() || null,
          description_en: data.description_en?.trim() || null,
          seating_capacity: data.seating_capacity ?? null,
        });
        const merged = { ...business, ...updated, info };
        setBusiness(merged);
        setIsNewBusiness(false);
        setSuccessMessage("Business profile updated!");
        setCurrentStep(2);
        return;
      }

      const newBusiness = await createBusiness({
        business_name: data.business_name,
        category: data.category,
        address: data.address,
        phone_number: data.phone_number,
        latitude: data.latitude,
        longitude: data.longitude,
        hero_image: data.hero_image,
      });
      const info = await updateBusinessInfo(newBusiness.id, {
        description_jp: data.description_jp?.trim() || null,
        description_en: data.description_en?.trim() || null,
        seating_capacity: data.seating_capacity ?? null,
      });
      let merged = {
        ...newBusiness,
        category: data.category as BusinessProfile["category"],
        info,
      };
      setBusiness(merged);
      setIsNewBusiness(true);
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
      const { hero_image, logo, ...rest } = data;
      const updated = await updateBusiness(business.id, { ...rest });
      setBusiness((prev) => ({ ...prev!, ...updated }));
      setSuccessMessage("Contact information saved!");
      setCurrentStep(3);
    } catch (err) {
      console.error("Step 2 error:", err);
    }
  };

  const handleStep3Submit = async (data: Partial<BusinessProfile>) => {
    if (!business) return;
    try {
      clearError();
      const { hero_image, logo, ...rest } = data;
      const updated = await updateBusiness(business.id, { ...rest });
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
      const { hero_image, logo, ...rest } = data;
      const updated = await updateBusiness(business.id, { ...rest });
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
              isNew={isNewBusiness}
            />
          )}

          {currentStep === 3 && business && (
            <Step3Form
              business={business}
              onSubmit={handleStep3Submit}
              loading={loading}
              error={error}
              isNew={isNewBusiness}
            />
          )}

          {currentStep === 4 && business && (
            <Step4Form
              business={business}
              onSubmit={handleStep4Submit}
              onPublish={() => publishBusiness(business.id)}
              loading={loading}
              error={error}
              isNew={isNewBusiness}
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
