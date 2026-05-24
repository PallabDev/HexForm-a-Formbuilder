"use client";

import { useState, useEffect } from "react";
import {
  IconCheck,
  IconLoader,
  IconCreditCard,
  IconArrowLeft,
  IconTrash,
  IconAlertCircle,
  IconActivity,
  IconSparkles,
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { trpc } from "~/trpc/client";
import { useUser } from "~/hooks/api/auth";

interface CheckoutResponse {
  simulated: boolean;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  keyId: string;
}

export default function BillingPage() {
  const { user } = useUser();
  const utils = trpc.useUtils();

  // Queries
  const { data: plans, isLoading: isPlansLoading } = trpc.product.listPlans.useQuery();
  const { data: subscription, isLoading: isSubLoading, refetch: refetchSub } = trpc.product.getSubscription.useQuery();

  // Mutations
  const checkoutMutation = trpc.product.checkout.useMutation();
  const verifyPaymentMutation = trpc.product.verifyPayment.useMutation();
  const cancelSubMutation = trpc.product.cancelSubscription.useMutation();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Load Razorpay script on demand
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planCode: string) => {
    setLoadingPlan(planCode);
    try {
      if (planCode === "free") {
        toast.info("To downgrade to the Free Plan, please cancel your active subscription. You will revert to Free once the current period ends.");
        return;
      }

      // 1. Create a strict Razorpay Order
      const checkoutRes = (await checkoutMutation.mutateAsync({ planCode })) as CheckoutResponse;

      // 2. Load the payment SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay payment SDK. Please verify your connection.");
        return;
      }

      // 3. Open the standard payment popup modal
      const options = {
        key: checkoutRes.keyId,
        amount: checkoutRes.amount,
        currency: checkoutRes.currency,
        name: "HexForm Premium",
        description: `Upgrade to ${checkoutRes.planName}`,
        order_id: checkoutRes.razorpayOrderId,
        handler: async (response: any) => {
          const loadingToast = toast.loading("Verifying payment signature with Razorpay...");
          try {
            await verifyPaymentMutation.mutateAsync({
              planCode,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.dismiss(loadingToast);
            toast.success(`Payment verified successfully! Your account has been upgraded to the ${checkoutRes.planName}.`);
            await refetchSub();
          } catch (verifyErr) {
            toast.dismiss(loadingToast);
            toast.error(verifyErr instanceof Error ? verifyErr.message : "Payment verification failed.");
          }
        },
        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
        },
        theme: {
          color: "#18181b",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate payment checkout.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your premium subscription? Your billing benefits will remain active until the end of your current 30-day billing cycle.")) return;
    try {
      await cancelSubMutation.mutateAsync({});
      toast.success("Active subscription cancelled. You will continue to have premium benefits until the renewal date, after which your account will revert to the Free Plan.");
      await refetchSub();
    } catch (err) {
      toast.error("Failed to cancel subscription");
    }
  };

  if (isSubLoading || isPlansLoading) {
    return (
      <main className="val-dot-grid min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
        <IconLoader className="size-8 text-zinc-500 animate-spin" />
      </main>
    );
  }

  // Calculate percentage of usage
  const activeForms = subscription?.usage?.activeForms ?? 0;
  const formLimit = subscription?.formLimit ?? 5;
  const percentage = Math.min((activeForms / formLimit) * 100, 100);

  return (
    <main className="val-dot-grid min-h-[calc(100dvh-6rem)] p-6 space-y-8 max-w-full px-6 mx-auto animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <header className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md uppercase text-[10px] tracking-widest px-2.5 py-0.5 font-sans">
            Billing Center
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans mt-2">
            ACCOUNT PLANS & BILLING
          </h1>
          <p className="text-xs text-zinc-400 font-sans">
            Manage your subscription details, check usage metrics, and upgrade to premium plans
          </p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        
        {/* CURRENT SUBSCRIPTION DETAILS CARD */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-3">
              ACTIVE PLAN PROFILE
            </h3>

            <div className="grid gap-2 text-xs font-sans">
              <div className="flex items-center justify-between border-b border-zinc-800/40 py-2.5">
                <span className="text-zinc-400">PLAN DESCRIPTION</span>
                <span className="text-white font-semibold uppercase">{subscription?.planName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/40 py-2.5">
                <span className="text-zinc-400">STATUS</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  subscription?.active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {subscription?.active ? "ACTIVE PREMIUM" : "FREE USER"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/40 py-2.5">
                <span className="text-zinc-400">FORMS ALLOWED</span>
                <span className="text-white font-semibold">
                  {subscription?.formLimit === 999999 ? "UNLIMITED" : subscription?.formLimit} ACTIVE FORMS
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/40 py-2.5">
                <span className="text-zinc-400">SUBMISSION LIMIT PER FORM</span>
                <span className="text-white font-semibold">
                  {subscription?.submissionLimit} RESPONSES
                </span>
              </div>

              {subscription?.currentPeriodEnd && (
                <div className="flex items-center justify-between border-b border-zinc-800/40 py-2.5">
                  <span className="text-zinc-400">NEXT RENEWAL DATE</span>
                  <span className="text-white font-mono">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {subscription?.active && (
            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleCancelSubscription}
                disabled={cancelSubMutation.isPending}
                className="bg-transparent border border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/50 rounded-lg text-xs font-semibold px-5 h-9"
              >
                {cancelSubMutation.isPending && <IconLoader className="size-3.5 animate-spin mr-1.5" />}
                Cancel Auto-Renewal
              </Button>
            </div>
          )}
        </div>

        {/* WORKSPACE RESOURCE UTILITY BAR */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-3">
              WORKSPACE QUOTA USAGE
            </h3>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">ACTIVE FORMS PROFILE</span>
                <span className="text-white font-mono font-bold">
                  {activeForms} / {subscription?.formLimit === 999999 ? "∞" : formLimit}
                </span>
              </div>

              {/* Progress Slider */}
              <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850">
                <div
                  className="bg-zinc-100 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="text-[10px] text-zinc-500 leading-relaxed leading-normal uppercase font-sans">
                Active forms count represents forms which are not soft-deleted / archived. Submissions limits are automatically validated upon respondent entries.
              </p>
            </div>
          </div>

          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex items-start gap-3">
            <IconSparkles className="size-5 text-zinc-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white">UPGRADE HIGHLIGHTS</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                Upgrading unlocks more forms space, expanded submission limits per form, and higher discoverability.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* PLANS SELECTION SLOTS */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-3">
          AVAILABLE TIERS
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          {plans?.map((plan) => {
            const isActivePlan = subscription?.planCode === plan.code;
            const isFree = plan.code === "free";
            const priceLabel = isFree ? "FREE" : `₹${plan.priceInPaise / 100}`;
            
            return (
              <div
                key={plan.id}
                className={`bg-zinc-900 border rounded-xl p-6 flex flex-col justify-between min-h-[340px] relative overflow-hidden transition duration-200 ${
                  isActivePlan ? "border-white" : "border-zinc-800"
                }`}
              >
                {isActivePlan && (
                  <Badge className="absolute top-4 right-4 bg-white text-zinc-950 font-semibold text-[8px] rounded-md border-none uppercase py-0.5">
                    Active Plan
                  </Badge>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">{plan.name}</h4>
                    <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="py-2">
                    <span className="text-3xl font-extrabold text-white">{priceLabel}</span>
                    {!isFree && <span className="text-zinc-500 text-xs font-medium font-sans"> / month</span>}
                  </div>

                  <ul className="space-y-2.5 text-xs text-zinc-300 font-sans pt-2 border-t border-zinc-800/40">
                    <li className="flex items-center gap-2">
                      <IconCheck className="size-4 text-zinc-400 shrink-0" />
                      <span>{plan.formLimit === null ? "Unlimited" : plan.formLimit} Active Survey Sheets</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck className="size-4 text-zinc-400 shrink-0" />
                      <span>{plan.submissionLimitPerForm} responses per form</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck className="size-4 text-zinc-400 shrink-0" />
                      <span>Clean responsive layouts</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  {isActivePlan ? (
                    <Button
                      disabled
                      className="w-full bg-zinc-800 text-zinc-500 rounded-lg text-xs font-semibold h-11 border border-zinc-700 cursor-not-allowed"
                    >
                      CURRENT ACTIVE PLAN
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.code)}
                      disabled={loadingPlan !== null}
                      className={`w-full rounded-lg text-xs font-semibold h-11 transition duration-200 ${
                        isFree 
                          ? "bg-transparent border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                          : "val-btn-red text-zinc-950 font-bold"
                      }`}
                    >
                      {loadingPlan === plan.code ? (
                        <IconLoader className="size-4 animate-spin mr-1.5" />
                      ) : null}
                      {isFree ? "Downgrade Tier" : "Upgrade Plan"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </main>
  );
}
