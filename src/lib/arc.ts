import type { ArcRequestType, ArcStatus, ArcDecision, ArcAttachmentLabel } from "@prisma/client";
import { lastFirst } from "@/lib/format";

export const ARC_REQUEST_TYPE_LABELS: Record<ArcRequestType, string> = {
  ADDITION: "Addition",
  PORCH: "Porch",
  SHED: "Shed",
  DECK_PATIO: "Deck/Patio",
  ROOFING: "Roofing",
  GAZEBO_PLAYHOUSE: "Gazebo/Playhouse",
  EXTERIOR_PAINT: "Exterior Paint",
  FENCE: "Fence",
  WALL_LANDSCAPING: "Wall/Landscaping",
  MAILBOX: "Mailbox",
  OTHER: "Other",
};

export const ARC_STATUS_LABELS: Record<ArcStatus, string> = {
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};

export const ARC_DECISION_LABELS: Record<ArcDecision, string> = {
  APPROVED: "Approved",
  CONDITIONAL_APPROVAL: "Conditional Approval",
  DENIED: "Denied",
};

export const ARC_ATTACHMENT_LABELS: Record<ArcAttachmentLabel, string> = {
  SURVEY: "Property Survey",
  PHOTOS: "Photos",
  PLANS: "Plans/Drawings",
  LANDSCAPING: "Landscaping Details",
  COMMITTEE_RESPONSE: "Committee Response",
  OTHER: "Other",
};

/** "Starting date must be at least 30 days after submitting application" (paper form rule). */
export const ARC_MIN_START_DAYS = 30;

/** e.g. "Holm, Tom - 123 Preserve Ln", or "... (2)" for a repeat requester. */
export function arcFolderLabel(req: { requesterName: string; requesterAddress: string; sequenceNumber: number }): string {
  const base = `${lastFirst(req.requesterName)} - ${req.requesterAddress}`;
  return req.sequenceNumber > 1 ? `${base} (${req.sequenceNumber})` : base;
}
