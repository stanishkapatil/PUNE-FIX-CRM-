"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";

import { SMSPreview } from "./SMSPreview";

const PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+91\s?[6-9]\d{9}$/, "Enter a valid Indian mobile number (e.g. +91 9876543210)");

const FormSchema = z.object({
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  ward: z.string().trim().min(1, "Please select your ward"),
  citizenPhone: PhoneSchema,
  photo: z
    .any()
    .optional()
    .refine(
      (f) => !f || f instanceof File,
      "Invalid photo",
    )
    .refine((f) => !f || ["image/jpeg", "image/png"].includes((f as File).type), "Photo must be JPEG or PNG")
    .refine((f) => !f || (f as File).size <= 5 * 1024 * 1024, "Photo must be <= 5MB"),
});

type Values = z.infer<typeof FormSchema>;

type Step = "idle" | "submitting" | "ai" | "done";

function wards(): string[] {
  return Array.from({ length: 20 }).map((_, i) => `Ward ${i + 1}`);
}

function toBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read photo"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  const base = "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium";
  if (done) {
    return (
      <div className={[base, "border-emerald-200 bg-emerald-50 text-emerald-800"].join(" ")}>
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
    );
  }
  if (active) {
    return (
      <div className={[base, "border-blue-200 bg-blue-50 text-[#1B2A4A]"].join(" ")}>
        <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" aria-hidden="true" />
        {label}
      </div>
    );
  }
  return <div className={[base, "border-slate-200 bg-white text-slate-600"].join(" ")}>{label}</div>;
}

export function ComplaintForm() {
  const [step, setStep] = useState<Step>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [success, setSuccess] = useState<null | {
    caseId: string;
    caseNumber: string;
    trackingUrl: string;
    slaHours: number;
  }>(null);

  const stickyRef = useRef<HTMLDivElement | null>(null);

  const defaultValues = useMemo<Values>(
    () => ({ description: "", ward: "", citizenPhone: "+91 ", photo: undefined }),
    [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const photo = watch("photo") as unknown as File | undefined;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!photo) {
        setPhotoPreview(null);
        return;
      }
      try {
        const url = URL.createObjectURL(photo);
        if (!cancelled) setPhotoPreview(url);
      } catch {
        if (!cancelled) setPhotoPreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photo]);

  const onSubmit = async (values: Values) => {
    setSubmitError(null);
    setStep("submitting");

    try {
      const photoBase64 = values.photo ? await toBase64DataUrl(values.photo as File) : undefined;

      // Minimal citizen payload; server stores a complete case object.
      const payload = {
        citizenName: "Citizen",
        citizenPhone: values.citizenPhone,
        ward: values.ward,
        title: "Citizen Complaint",
        category: "General",
        description: values.description,
        photoBase64,
      };

      const res = await fetch("/api/v1/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.error || "Failed to submit complaint. Please try again.";
        setSubmitError(msg);
        setStep("idle");
        return;
      }

      const caseId = String(json.caseId ?? "");
      const caseNumber = String(json.caseNumber ?? "");
      const trackingUrl = String(json.trackingUrl ?? `/track/${caseId}`);

      if (!caseId || !caseNumber) {
        setSubmitError("Submission succeeded but response was incomplete. Please contact support.");
        setStep("idle");
        return;
      }

      setSuccess({ caseId, caseNumber, trackingUrl, slaHours: 96 });
      setStep("ai");

      // UX: show AI step briefly; classification is async server-side
      setTimeout(() => setStep("done"), 1200);
      reset(defaultValues);
      setValue("photo", undefined as any);
      setPhotoPreview(null);
    } catch (e: any) {
      setSubmitError(e?.message || "Failed to submit complaint. Please try again.");
      setStep("idle");
    }
  };

  const disabled = isSubmitting || step === "submitting" || step === "ai";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <StepPill active={step === "submitting"} done={step === "ai" || step === "done"} label="Submitting" />
        <StepPill active={step === "ai"} done={step === "done"} label="AI Analysing" />
        <StepPill active={false} done={step === "done"} label="Done" />
      </div>

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-emerald-900">Complaint submitted successfully</div>
              <div className="mt-1 text-sm text-emerald-800">
                Case Number: <span className="font-semibold">{success.caseNumber}</span>
              </div>
              <div className="mt-2">
                <a
                  href={success.trackingUrl}
                  className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  Track your complaint
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <SMSPreview
              caseNumber={success.caseNumber}
              trackingUrl={success.trackingUrl}
              expectedResolutionHours={success.slaHours}
            />
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <label className="block text-sm font-semibold text-[#1B2A4A]">Description</label>
          <textarea
            rows={6}
            placeholder="Describe your complaint in detail..."
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
            {...register("description")}
          />
          {errors.description ? <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p> : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <label className="block text-sm font-semibold text-[#1B2A4A]">Ward</label>
            <select
              className="mt-2 w-full h-11 rounded-lg border border-slate-300 px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
              {...register("ward")}
              defaultValue=""
            >
              <option value="" disabled>
                Select your ward
              </option>
              {wards().map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            {errors.ward ? <p className="mt-1 text-sm text-red-600">{errors.ward.message as string}</p> : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <label className="block text-sm font-semibold text-[#1B2A4A]">Phone Number</label>
            <input
              inputMode="tel"
              placeholder="+91 9876543210"
              className="mt-2 w-full h-11 rounded-lg border border-slate-300 px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
              {...register("citizenPhone")}
            />
            {errors.citizenPhone ? (
              <p className="mt-1 text-sm text-red-600">{errors.citizenPhone.message as string}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#1B2A4A]">Optional photo</div>
              <div className="mt-1 text-sm text-slate-600">JPEG/PNG only, max 5MB.</div>
            </div>
            <label className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 cursor-pointer">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setValue("photo", f as any, { shouldValidate: true });
                }}
              />
            </label>
          </div>

          {errors.photo ? <p className="mt-2 text-sm text-red-600">{errors.photo.message as string}</p> : null}

          {photoPreview ? (
            <div className="mt-4">
              <div className="text-sm font-medium text-slate-700">Preview</div>
              <img
                src={photoPreview}
                alt="Uploaded preview"
                className="mt-2 w-full max-h-64 object-contain rounded-lg border border-slate-200 bg-slate-50"
              />
            </div>
          ) : null}
        </div>

        <div
          ref={stickyRef}
          className="sticky bottom-0 left-0 right-0 -mx-4 px-4 pb-4 pt-3 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent"
        >
          <button
            type="submit"
            disabled={disabled}
            className="w-full h-12 rounded-lg bg-[#2563EB] text-white text-base font-semibold hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {disabled ? "Submitting..." : "Submit Complaint"}
          </button>
          <div className="mt-2 text-xs text-slate-500">
            By submitting, you agree to share details for resolution purposes.
          </div>
        </div>
      </form>
    </div>
  );
}

