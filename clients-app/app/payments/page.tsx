"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import StripePaymentForm from "@/components/StripePaymentForm";
import BankTransferPayment from "@/components/BankTransferPayment";
import {
  PaymentMethod,
  Subscription,
  fetchAvailableSubscriptions,
  createPaymentIntent,
  upgradeSubscription,
} from "@/lib/api/payments";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscription_id");

  const [step, setStep] = useState<
    "select_method" | "payment_form" | "success" | "error"
  >("select_method");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    if (subscriptionId) {
      loadSubscriptions();
    } else {
      router.push("/plans");
    }
  }, [subscriptionId, router]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await fetchAvailableSubscriptions();
      setSubscriptions(data);

      const subscription = data.find((s) => s.id === parseInt(subscriptionId!));
      if (subscription) {
        setSelectedSubscription(subscription);
      } else {
        setError("Subscription not found");
        setStep("error");
      }
    } catch (err) {
      setError("Failed to load subscription details");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    setError(null);

    if (!selectedSubscription) return;

    // For bank transfer, go directly to payment form
    if (method.type === "bank_transfer") {
      setStep("payment_form");
      return;
    }

    // For card payments, create payment intent
    if (method.gateway?.type === "stripe") {
      try {
        setProcessing(true);
        console.log("Creating payment intent for:", {
          amount: selectedSubscription.price,
          currency: selectedSubscription.currency,
          payment_method_id: method.id,
          subscription_id: selectedSubscription.id,
        });

        const intent = await createPaymentIntent({
          amount: selectedSubscription.price,
          currency: selectedSubscription.currency,
          payment_method_id: method.id,
          subscription_id: selectedSubscription.id,
        });

        console.log("Payment intent created:", intent);
        setPaymentIntent(intent);
        setStep("payment_form");
      } catch (err: any) {
        console.error("Payment intent creation error:", err);
        setError(
          `Failed to initialize payment: ${
            err.message || err
          }. Please try again.`
        );
      } finally {
        setProcessing(false);
      }
    } else {
      // For other payment methods, show mock form
      setStep("payment_form");
    }
  };

  const handlePaymentSuccess = async (paymentData?: any) => {
    try {
      setProcessing(true);

      if (selectedMethod?.type === "bank_transfer") {
        setSuccessMessage(
          "Your bank transfer notification has been received. We'll process your subscription upgrade within 1-3 business days and notify you via email."
        );
      } else {
        // For card payments, verify payment status and upgrade subscription
        if (selectedMethod && selectedSubscription && paymentData) {
          console.log("Payment succeeded:", paymentData);

          // First confirm the payment with our backend
          if (paymentData.id) {
            try {
              const confirmResult = await fetch(
                `http://localhost:8000/api/v1/payments/confirm/${paymentData.id}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );

              if (!confirmResult.ok) {
                throw new Error("Payment confirmation failed");
              }

              const confirmData = await confirmResult.json();
              console.log("Payment confirmed:", confirmData);
            } catch (confirmError) {
              console.error("Payment confirmation error:", confirmError);
              // Continue with upgrade even if confirmation fails
            }
          }

          // Upgrade subscription
          const upgradeResult = await upgradeSubscription(
            selectedSubscription.id,
            selectedMethod.id
          );
          console.log("Subscription upgrade result:", upgradeResult);

          setSuccessMessage(
            `Payment successful! Your subscription has been upgraded to ${selectedSubscription.name}. You now have access to all premium features.`
          );
        }
      }

      setStep("success");
    } catch (err: any) {
      console.error("Payment success handling error:", err);
      setError(
        `Payment was processed but subscription upgrade failed: ${
          err.message || err
        }. Please contact support.`
      );
      setStep("error");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setStep("error");
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const renderBackButton = () => (
    <button
      onClick={() => {
        if (step === "payment_form") {
          setStep("select_method");
        } else {
          router.push("/plans");
        }
      }}
      className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
    >
      <ArrowLeftIcon className="h-5 w-5 mr-2" />
      {step === "payment_form" ? "Back to Payment Methods" : "Back to Plans"}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {step !== "success" && renderBackButton()}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === "success"
              ? "Payment Successful!"
              : "Complete Your Payment"}
          </h1>
          {selectedSubscription && step !== "success" && (
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {selectedSubscription.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedSubscription.duration_months} month
                    {selectedSubscription.duration_months > 1 ? "s" : ""}{" "}
                    subscription
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      selectedSubscription.price,
                      selectedSubscription.currency
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    per {selectedSubscription.duration_months} month
                    {selectedSubscription.duration_months > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step Content */}
        {step === "select_method" && selectedSubscription && (
          <PaymentMethodSelector
            selectedMethodId={selectedMethod?.id}
            onMethodSelect={handleMethodSelect}
            amount={selectedSubscription.price}
            currency={selectedSubscription.currency}
          />
        )}

        {step === "payment_form" && selectedMethod && selectedSubscription && (
          <div>
            {selectedMethod.type === "bank_transfer" ? (
              <BankTransferPayment
                amount={selectedSubscription.price}
                currency={selectedSubscription.currency}
                subscriptionId={selectedSubscription.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            ) : (
              paymentIntent && (
                <StripePaymentForm
                  amount={selectedSubscription.price}
                  currency={selectedSubscription.currency}
                  clientSecret={paymentIntent.client_secret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  loading={processing}
                />
              )
            )}
          </div>
        )}

        {step === "success" && (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm border">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {successMessage}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/plans")}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                View All Plans
              </button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm border">
            <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Error
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError(null);
                  setStep("select_method");
                }}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/plans")}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back to Plans
              </button>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {processing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Processing Payment
                </h3>
                <p className="text-sm text-gray-500">
                  Please wait while we process your payment...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
