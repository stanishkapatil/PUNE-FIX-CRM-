"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { UrgencyBadge } from "../../../components/UrgencyBadge";
import { LoadingSpinner } from "../../../components/LoadingSpinner";

export default function TrackCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await fetch(`/api/cases/${id}`);
        const data = await res.json();
        if (res.ok && data.case) {
          setCaseData(data.case);
        } else {
          toast.error("Case not found");
        }
      } catch (e) {
        toast.error("Failed to fetch case");
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [id]);

  const handleRatingSubmit = async () => {
    if (rating === 0) return toast.error("Please select a rating");
    setIsSubmittingRating(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: id, rating, comment }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      toast.success("Thank you for your feedback!");
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Error submitting rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner size={32} color="#2563EB" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p>Case not found.</p>
        <Link href="/">Return Home</Link>
      </div>
    );
  }

  const isResolved = caseData.status === "resolved";
  const completedSteps = caseData.timeline?.length || 1;
  const progressPercent = Math.min((completedSteps / 5) * 100, 100);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto", backgroundColor: "#FFFFFF", position: "relative" }}>
        {/* TOP BANNER */}
        <div style={{ backgroundColor: "#0D9488", color: "#FFFFFF", padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <Link href="/" style={{ color: "#FFFFFF", textDecoration: "none", fontSize: "16px", marginRight: "16px" }}>
              ←
            </Link>
            <h1 style={{ margin: "0", fontSize: "18px", fontWeight: "bold" }}>
              Case {caseData.id} — {caseData.status === "resolved" ? "Resolved" : "In Progress"}
            </h1>
          </div>
          <p style={{ margin: "0", fontSize: "11px", textTransform: "uppercase", opacity: 0.8, marginLeft: "32px" }}>
            {caseData.status === "resolved" ? "CLOSED REPORT" : "ACTIVE REPORT"}
          </p>
        </div>

        {/* PROGRESS SECTION */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1B2A4A" }}>
              {isResolved ? "Resolution Complete" : "Investigation Stage"}
            </span>
            <span style={{ fontSize: "13px", color: "#94A3B8" }}>
              {completedSteps} of 5 steps completed
            </span>
          </div>
          <div style={{ width: "100%", height: "6px", backgroundColor: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: "#0D9488", transition: "width 0.3s" }}></div>
          </div>
        </div>

        {/* CASE INFORMATION CARD */}
        <div
          style={{
            margin: "16px 24px",
            padding: "20px",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#1B2A4A", textTransform: "uppercase", marginBottom: "12px" }}>
            CASE INFORMATION
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <span style={{ backgroundColor: "#1E293B", color: "#FFFFFF", fontSize: "12px", borderRadius: "20px", padding: "4px 10px" }}>
              {caseData.category}
            </span>
            <span style={{ backgroundColor: "#1E293B", color: "#FFFFFF", fontSize: "12px", borderRadius: "20px", padding: "4px 10px" }}>
              📍 {caseData.ward}
            </span>
            {caseData.urgencyScore !== undefined && (
                <UrgencyBadge urgency={caseData.urgencyScore >= 80 ? "CRITICAL" : caseData.urgencyScore >= 60 ? "HIGH" : caseData.urgencyScore >= 30 ? "MEDIUM" : "LOW"} />
            )}
          </div>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "8px" }}>
             "{caseData.description}"
          </div>
        </div>

        {/* TIMELINE */}
        <div style={{ padding: "24px", backgroundColor: "#FFFFFF" }}>
          {[
            { title: "Complaint submitted" },
            { title: "AI Classification" },
            { title: "Assigned to department" },
            { title: "Investigation in progress" },
            { title: "Resolution & Fix" },
          ].map((defaultStep: any, index: number) => {
            const step = caseData.timeline && index < caseData.timeline.length ? caseData.timeline[index] : null;
            const isLast = index === 4;
            const isCompleted = isResolved || (step !== null && index < caseData.timeline.length - 1);
            const isCurrent = !isResolved && step !== null && index === caseData.timeline.length - 1;

            return (
              <div key={index} style={{ display: "flex", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ 
                      width: "28px", height: "28px", borderRadius: "50%", 
                      backgroundColor: isCompleted ? "#16A34A" : isCurrent ? "#2563EB" : "#E2E8F0", 
                      color: isCompleted || isCurrent ? "#FFFFFF" : "#94A3B8", 
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" 
                  }}>
                    {isCompleted ? "✓" : isCurrent ? "🔄" : "⏳"}
                  </div>
                  {!isLast && <div style={{ width: "2px", height: "32px", backgroundColor: isCompleted ? "#16A34A" : "#E2E8F0", margin: "4px 0" }}></div>}
                </div>
                <div style={{ paddingBottom: isLast ? "0" : "16px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: step ? "#1B2A4A" : "#94A3B8" }}>{step ? step.title : defaultStep.title}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                     {step ? `${new Date(step.timestamp).toLocaleDateString()} ${new Date(step.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Pending"}
                  </div>
                </div>
              </div>
            );
         })}
        </div>

        {/* OFFICER UPDATES */}
        {caseData.officerUpdates?.length > 0 && (
          <div style={{ padding: "24px", paddingTop: 0, backgroundColor: "#FFFFFF" }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#1B2A4A", textTransform: "uppercase", marginBottom: "16px" }}>
              OFFICER UPDATES
            </div>
            {caseData.officerUpdates.map((update: any, idx: number) => (
               <div key={idx} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                  👤
                </div>
                <div style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: "#1B2A4A" }}>{update.officerName}</span>
                    <span style={{ fontSize: "12px", color: "#94A3B8" }}>{new Date(update.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p style={{ margin: "0", fontSize: "13px", color: "#64748B", fontStyle: "italic", lineHeight: "1.5" }}>
                    "{update.message}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BOTTOM */}
        <div style={{ padding: "24px", backgroundColor: "#FFFFFF" }}>
          <button
            disabled={!isResolved}
            onClick={() => setIsModalOpen(true)}
            aria-label="Rate this experience"
            style={{
              width: "100%",
              height: "44px",
              backgroundColor: isResolved ? "#2563EB" : "#F8FAFC",
              color: isResolved ? "#FFFFFF" : "#94A3B8",
              border: isResolved ? "none" : "1px solid #E2E8F0",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: isResolved ? "pointer" : "not-allowed",
              marginBottom: "12px",
            }}
          >
            Rate this experience ⭐
          </button>
          {!isResolved && (
              <div style={{ textAlign: "center", fontSize: "11px", color: "#94A3B8", textTransform: "uppercase" }}>
                AVAILABLE AFTER RESOLUTION
              </div>
          )}
        </div>

        {/* RATING MODAL */}
        {isModalOpen && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }}>
                <div style={{ backgroundColor: "#FFF", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1B2A4A" }}>Rate your experience</h3>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", justifyContent: "center" }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <span 
                                key={star} 
                                onClick={() => setRating(star)}
                                style={{ fontSize: "32px", cursor: "pointer", color: star <= rating ? "#F59E0B" : "#E2E8F0" }}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <textarea 
                        placeholder="Leave a comment (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={{ width: "100%", height: "80px", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontFamily: "inherit", resize: "none" }}
                    />
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            style={{ flex: 1, backgroundColor: "#E2E8F0", color: "#64748B", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "bold", cursor: "pointer" }}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleRatingSubmit}
                            disabled={isSubmittingRating}
                            style={{ flex: 1, backgroundColor: "#2563EB", color: "#FFF", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center" }}
                        >
                            {isSubmittingRating ? <LoadingSpinner size={16} /> : "Submit"}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
