/* eslint-disable @typescript-eslint/consistent-type-definitions */

// Core enums (must match .cursorrules)
export enum CaseStatus {
  received = "received",
  analysed = "analysed",
  assigned = "assigned",
  in_progress = "in_progress",
  resolved = "resolved",
  closed = "closed",
}

export enum UrgencyLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum UserRole {
  staff = "staff",
  supervisor = "supervisor",
  mla = "mla",
  admin = "admin",
}

// Shared primitives
export type ISODateString = string; // e.g. new Date().toISOString()
export type FirestoreTimestampLike =
  | Date
  | ISODateString
  | { seconds: number; nanoseconds: number }
  | { _seconds: number; _nanoseconds: number };

export type Sentiment = "positive" | "neutral" | "negative" | "urgent";

export type Department =
  | "Water Supply"
  | "Roads & Infrastructure"
  | "Electricity"
  | "Sanitation"
  | "Tax & Finance"
  | "General"
  | string;

export type CaseCategory =
  | "Water Supply"
  | "Roads & Infrastructure"
  | "Electricity"
  | "Sanitation"
  | "Tax & Finance"
  | "General"
  | "Unclassified"
  | string;

export interface GeoPointLike {
  lat: number;
  lng: number;
}

export interface FileAttachment {
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  storagePath?: string;
}

// AI classification fields (as defined in .cursorrules)
export interface AIClassification {
  category: CaseCategory;
  sub_category: string;
  urgency_score: number; // 1-100
  sentiment: Sentiment;
  department: Department;
  suggested_response: string;
  confidence: number; // 0-100
  vulnerable_flag: boolean;
}

export interface PriorityScoreFields {
  priority_score: number; // computed score (0-100, clamped)
  sla_hours_left: number;
  sla_percent_left: number; // 0-100
  sla_remaining_inverse: number; // 0-100
}

// Firestore documents
export interface Case {
  id: string;
  case_number: string; // PCRM-YYYY-XXXX

  // Citizen submitted
  citizen_name: string;
  citizen_phone: string; // stored raw; UI should mask +91 98765****** format
  citizen_email?: string;
  citizen_address?: string;
  ward: string;
  location?: GeoPointLike;

  title: string;
  description: string;
  category: CaseCategory;
  sub_category?: string;
  department?: Department;

  attachments?: FileAttachment[];

  // Lifecycle
  status: CaseStatus;
  assigned_to_uid?: string;
  assigned_to_name?: string;
  assigned_at?: FirestoreTimestampLike;
  resolved_at?: FirestoreTimestampLike;
  closed_at?: FirestoreTimestampLike;

  // AI
  ai?: AIClassification;
  human_review_flag: boolean;
  ai_classified_at?: FirestoreTimestampLike;

  // Flags for scoring / automation
  is_recurring: boolean;
  vulnerable_flag: boolean; // duplicated for easy query/sort even if ai missing

  // SLA + scoring
  sla_hours: number;
  sla_deadline: FirestoreTimestampLike;
  priority?: PriorityScoreFields;

  // Audit
  created_at: FirestoreTimestampLike;
  updated_at: FirestoreTimestampLike;
  created_by_uid?: string; // optional for citizen submissions (anonymous allowed)
}

export interface CaseTimeline {
  id: string;
  case_id: string;
  type:
    | "created"
    | "ai_classified"
    | "status_changed"
    | "assigned"
    | "comment"
    | "attachment_added"
    | "resolved"
    | "closed";
  message: string;
  from_status?: CaseStatus;
  to_status?: CaseStatus;
  actor_uid?: string;
  actor_name?: string;
  created_at: FirestoreTimestampLike;
  meta?: Record<string, unknown>;
}

export type AlertSeverity = UrgencyLevel; // MEDIUM/HIGH/CRITICAL from cascade rule; LOW allowed for completeness

export interface Alert {
  id: string;
  category: CaseCategory;
  ward: string;
  case_count: number;
  window_hours: number; // expected 72
  severity: AlertSeverity;
  created_at: FirestoreTimestampLike;
  last_case_at?: FirestoreTimestampLike;
  is_active: boolean;
}

export interface Feedback {
  id: string;
  case_id: string;
  citizen_name?: string;
  citizen_phone?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  message?: string;
  created_at: FirestoreTimestampLike;
}

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  ward?: string;
  department?: Department;
  avatar_url?: string;
  is_active: boolean;
  created_at: FirestoreTimestampLike;
  updated_at: FirestoreTimestampLike;
}

export type NotificationType =
  | "case_submitted"
  | "status_updated"
  | "cascade_alert"
  | "ai_classification_complete"
  | "system";

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  case_id?: string;
  alert_id?: string;
  created_at: FirestoreTimestampLike;
  read_at?: FirestoreTimestampLike;
}

// API response envelope (simple, consistent)
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

// API: /api/v1/cases (POST)
export interface CreateCaseRequest {
  citizen_name: string;
  citizen_phone: string;
  citizen_email?: string;
  citizen_address?: string;
  ward: string;
  location?: GeoPointLike;
  title: string;
  description: string;
  category: CaseCategory;
  attachments?: FileAttachment[];
  is_recurring?: boolean;
}

export interface CreateCaseResponseData {
  case_id: string;
  case_number: string;
  status: CaseStatus;
  created_at: ISODateString;
}

export type CreateCaseResponse = ApiResponse<CreateCaseResponseData>;

// API: /api/v1/cases/[id] (PATCH)
export interface UpdateCaseRequest {
  status?: CaseStatus;
  assigned_to_uid?: string | null;
  assigned_to_name?: string | null;
  department?: Department | null;
  category?: CaseCategory;
  sub_category?: string | null;
  title?: string;
  description?: string;
  is_recurring?: boolean;
  vulnerable_flag?: boolean;
}

export interface UpdateCaseResponseData {
  case_id: string;
  status: CaseStatus;
  updated_at: ISODateString;
}

export type UpdateCaseResponse = ApiResponse<UpdateCaseResponseData>;

// API: /api/v1/ai/classify (POST)
export interface AIClassifyRequest {
  case_id: string;
  title: string;
  description: string;
  ward?: string;
}

export interface AIClassifyResponseData {
  case_id: string;
  ai: AIClassification;
  human_review_flag: boolean;
  classified_at: ISODateString;
}

export type AIClassifyResponse = ApiResponse<AIClassifyResponseData>;

// API: /api/v1/ai/brief (POST)
export interface AIBriefRequest {
  case_id: string;
  title: string;
  description: string;
  category?: CaseCategory;
  department?: Department;
  status?: CaseStatus;
  timeline?: Array<Pick<CaseTimeline, "type" | "message" | "created_at">>;
}

export interface AIBriefResponseData {
  case_id: string;
  brief_markdown: string;
  created_at: ISODateString;
}

export type AIBriefResponse = ApiResponse<AIBriefResponseData>;

// API: /api/v1/ai/draft (POST)
export interface AIDraftRequest {
  case_id: string;
  department?: Department;
  citizen_name?: string;
  title: string;
  description: string;
  sentiment?: Sentiment;
  urgency_level?: UrgencyLevel;
}

export interface AIDraftResponseData {
  case_id: string;
  suggested_response: string;
  created_at: ISODateString;
}

export type AIDraftResponse = ApiResponse<AIDraftResponseData>;

// API: /api/v1/feedback (POST)
export interface CreateFeedbackRequest {
  case_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  message?: string;
  citizen_name?: string;
  citizen_phone?: string;
}

export interface CreateFeedbackResponseData {
  feedback_id: string;
  case_id: string;
  created_at: ISODateString;
}

export type CreateFeedbackResponse = ApiResponse<CreateFeedbackResponseData>;

// API: /api/v1/cron/recalculate-scores (GET)
export interface RecalculateScoresResponseData {
  processed: number;
  updated: number;
  started_at: ISODateString;
  finished_at: ISODateString;
}

export type RecalculateScoresResponse = ApiResponse<RecalculateScoresResponseData>;

