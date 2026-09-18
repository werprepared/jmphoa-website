import type { ArcDecision, ArcStatus } from "@prisma/client";
import { ARC_DECISION_LABELS, ARC_STATUS_LABELS } from "@/lib/arc";

const DECISION_CLASSES: Record<ArcDecision, string> = {
  APPROVED: "bg-green-100 text-green-800",
  CONDITIONAL_APPROVAL: "bg-amber-100 text-amber-800",
  DENIED: "bg-red-100 text-red-800",
};

export default function ArcStatusBadge({ status, decision }: { status: ArcStatus; decision: ArcDecision | null }) {
  const label = status === "COMPLETED" && decision ? ARC_DECISION_LABELS[decision] : ARC_STATUS_LABELS[status];
  const className = status === "COMPLETED" && decision ? DECISION_CLASSES[decision] : "bg-gold/20 text-navy";

  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>{label}</span>;
}
