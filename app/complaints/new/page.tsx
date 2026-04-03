"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const SecurityCheckUI = ({ step }: { step: number }) => (
  <div style={{
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 8,
    padding: '12px 16px',
    marginTop: 12,
    fontSize: 13,
  }}>
    <div style={{ fontWeight: 600, color: '#15803D', marginBottom: 8 }}>
      🔒 Verifying your submission...
    </div>
    {[
      'Verifying submission limits',
      'AI content validation',
    ].map((label, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        color: i < step ? '#15803D' : i === step ? '#1B2A4A' : '#94A3B8',
        marginBottom: 4, fontSize: 12,
      }}>
        <span>{i < step ? '✅' : i === step ? '⏳' : '○'}</span>
        <span>{label}</span>
      </div>
    ))}
  </div>
);

export default function FileComplaintPage() {
  const router = useRouter();
  
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Water Supply");
  const [ward, setWard] = useState("Ward 1");
  const [phone, setPhone] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityStep, setSecurityStep] = useState(0);
  const [errors, setErrors] = useState<{description?: string, phone?: string}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setPhone(val);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!description.trim()) newErrors.description = "Description is required";
    if (!phone || phone.length < 10) newErrors.phone = "Valid phone number required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSecurityStep(0); 
    
    try {
      const res = await fetch("/api/complaints/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          ward,
          phone,
          photoBase64
        })
      });

      if (res.status === 429) {
          const data = await res.json();
          toast.error(data.error || "Too many requests");
          setErrors({ description: data.error }); 
          setIsSubmitting(false);
          setSecurityStep(0);
          return;
      }
      
      setSecurityStep(1); // Passed rate limit internally
      
      if (res.status === 422) {
          const data = await res.json();
          toast.error(data.error || "Submission blocked: Invalid content");
          setErrors({ description: data.reason || "Invalid content" }); 
          setIsSubmitting(false);
          setSecurityStep(0);
          return;
      }

      setSecurityStep(2); // Passed AI internally

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      
      toast.success("Complaint submitted successfully!", { duration: 4000 });
      router.push(`/track/${data.caseId}`);

    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setIsSubmitting(false);
      setSecurityStep(0);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#1B2A4A",
              fontSize: "20px",
              marginRight: "16px",
            }}
          >
            ←
          </Link>
          <div>
            <h1 style={{ margin: "0", fontSize: "20px", fontWeight: "bold", color: "#1B2A4A" }}>
              File a Complaint
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94A3B8" }}>
              Takes less than 60 seconds
            </p>
          </div>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Describe Issue */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="description" style={{ fontSize: "14px", fontWeight: "normal", color: "#1B2A4A" }}>
              Describe your issue *
            </label>
            <textarea
              id="description"
              placeholder="Describe the problem in detail..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                height: "120px",
                border: errors.description ? "1px solid #DC2626" : "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "16px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            {errors.description && <span style={{ color: "#DC2626", fontSize: "12px" }}>{errors.description}</span>}
          </div>

          {/* Category */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="category" style={{ fontSize: "14px", fontWeight: "normal", color: "#1B2A4A" }}>
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                height: "44px",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "0 12px",
                fontSize: "16px",
                fontFamily: "inherit",
                backgroundColor: "#fff",
              }}
            >
              <option value="Water Supply">Water Supply</option>
              <option value="Roads & Infrastructure">Roads & Infrastructure</option>
              <option value="Electricity">Electricity</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Tax & Finance">Tax & Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Ward */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="ward" style={{ fontSize: "14px", fontWeight: "normal", color: "#1B2A4A" }}>Ward</label>
            <select
              id="ward"
              value={ward}
              onChange={e => setWard(e.target.value)}
              style={{
                height: "44px",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "0 12px",
                fontSize: "16px",
                fontFamily: "inherit",
                backgroundColor: "#fff",
              }}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={`Ward ${i + 1}`}>
                  Ward {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="phone" style={{ fontSize: "14px", fontWeight: "normal", color: "#1B2A4A" }}>
              Phone Number *
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: errors.phone ? "1px solid #DC2626" : "1px solid #E2E8F0",
                borderRadius: "8px",
                height: "44px",
                overflow: "hidden",
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  padding: "0 12px",
                  color: "#64748B",
                  fontSize: "16px",
                  backgroundColor: "#F8FAFC",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  borderRight: "1px solid #E2E8F0",
                }}
              >
                +91
              </div>
              <input
                id="phone"
                type="tel"
                placeholder="XXXXX XXXXX"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                style={{
                  flex: 1,
                  height: "100%",
                  border: "none",
                  padding: "0 12px",
                  fontSize: "16px",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>
            {errors.phone && <span style={{ color: "#DC2626", fontSize: "12px" }}>{errors.phone}</span>}
          </div>

          {/* Photo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "normal", color: "#1B2A4A" }}>
              Photo (Optional)
            </label>
            <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={handlePhotoUpload}
            />
            {photoBase64 ? (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <img src={photoBase64} alt="Preview" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                    <span style={{ fontSize: "12px", color: "#64748B" }}>{photoName}</span>
                    <button type="button" onClick={() => { setPhotoBase64(null); setPhotoName(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} style={{ border:"none", background:"none", color:"#DC2626", cursor:"pointer", fontSize: "12px" }}>Remove</button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        height: "80px",
                        border: "1px dashed #E2E8F0",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        backgroundColor: "#F8FAFC"
                    }}
                >
                <span style={{ color: "#94A3B8", fontSize: "14px" }}>📷 Upload Photo</span>
                </div>
            )}
          </div>

          {isSubmitting && <SecurityCheckUI step={securityStep} />}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              height: "44px",
              backgroundColor: isSubmitting ? "#94A3B8" : "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              marginTop: "8px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {isSubmitting ? <LoadingSpinner size={16} /> : "Submit Complaint →"}
          </button>
          
          <p style={{ margin: "0", fontSize: "12px", color: "#94A3B8", textAlign: "center" }}>
            No account needed. Your data is protected.
          </p>
        </form>
      </div>
    </div>
  );
}
