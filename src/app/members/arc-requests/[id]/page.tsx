import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { canDecideArcRequests } from "@/lib/roles";
import { formatPhone, formatDateOnly } from "@/lib/format";
import {
  arcFolderLabel,
  ARC_ATTACHMENT_LABELS,
  ARC_DECISION_LABELS,
  ARC_REQUEST_TYPE_LABELS,
} from "@/lib/arc";
import ArcStatusBadge from "../ArcStatusBadge";
import { addArcAttachmentAction, decideArcRequestAction } from "../actions";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-navy">{value}</div>
    </div>
  );
}

export default async function ArcRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireApprovedUser();
  const { id } = await params;

  const request = await prisma.arcRequest.findUnique({
    where: { id },
    include: { attachments: { include: { uploadedBy: true }, orderBy: { createdAt: "asc" } }, decidedBy: true },
  });
  if (!request) notFound();

  const isOwner = request.requesterId === viewer.id;
  const isCommittee = canDecideArcRequests(viewer.roles);
  const canUpload = isOwner || isCommittee;
  const canSeeContactInfo = isOwner || isCommittee;

  return (
    <div>
      <PageHeader title={arcFolderLabel(request)} subtitle="ARC Request" />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <Link href="/members/arc-requests" className="text-sm text-primary hover:underline">
          ← All ARC Requests
        </Link>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Submitted {format(request.createdAt, "MMM d, yyyy")}</span>
            <ArcStatusBadge status={request.status} decision={request.decision} />
          </div>

          <Field label="Name" value={request.requesterName} />
          <Field label="Address/Unit #" value={request.requesterAddress} />
          {canSeeContactInfo && <Field label="Phone" value={formatPhone(request.requesterPhone)} />}
          {canSeeContactInfo && <Field label="Email" value={request.requesterEmail} />}

          <Field
            label="Requested Change"
            value={request.requestType === "OTHER" ? request.requestTypeOther : ARC_REQUEST_TYPE_LABELS[request.requestType]}
          />
          <Field label="Location on property" value={request.locationOnProperty} />
          <Field label="Size/dimensions" value={request.sizeDimensions} />
          <Field label="Color" value={request.color} />
          <Field label="Materials" value={request.materials} />
          <Field label="Estimated starting date" value={request.startDate ? formatDateOnly(request.startDate) : null} />
          <Field label="Estimated completion date" value={request.completionDate ? formatDateOnly(request.completionDate) : null} />
          <Field label="Contractor" value={request.contractorName} />
        </div>

        {request.status === "COMPLETED" && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <h2 className="font-semibold text-navy text-sm">Architectural Control Committee Decision</h2>
            <Field label="Decision" value={request.decision ? ARC_DECISION_LABELS[request.decision] : null} />
            <Field label="Reason" value={request.decisionReason} />
            <Field label="Date reviewed" value={request.dateReviewed ? formatDateOnly(request.dateReviewed) : null} />
            <Field
              label="Date homeowner notified"
              value={request.dateHomeownerNotified ? formatDateOnly(request.dateHomeownerNotified) : null}
            />
            <Field label="Decided by" value={request.decidedBy?.name} />
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-semibold text-navy text-sm">Documents</h2>
          {request.attachments.length === 0 ? (
            <p className="text-sm text-muted">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-1">
              {request.attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm bg-white border border-border rounded px-3 py-2">
                  <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                    📎 {a.fileName}
                  </a>
                  <span className="text-xs text-muted shrink-0">
                    {ARC_ATTACHMENT_LABELS[a.label]} · {a.uploadedBy.name} · {format(a.createdAt, "MMM d, yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {canUpload && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await addArcAttachmentAction(request.id, formData);
              }}
              className="flex gap-2 items-end pt-2"
            >
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1" htmlFor="file">
                  Add a document
                </label>
                <input id="file" name="file" type="file" required className="text-sm" />
              </div>
              <button className="bg-white border border-border hover:border-primary text-navy text-sm font-medium px-4 py-2 rounded transition-colors">
                Upload
              </button>
            </form>
          )}
        </div>

        {isCommittee && request.status === "PROCESSING" && (
          <form
            action={async (formData: FormData) => {
              "use server";
              await decideArcRequestAction(request.id, formData);
            }}
            className="bg-card border border-border rounded-lg p-6 space-y-3"
          >
            <h2 className="font-semibold text-navy text-sm">Record Committee Decision</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-muted mb-1" htmlFor="dateReviewed">
                  Date reviewed
                </label>
                <input id="dateReviewed" name="dateReviewed" type="date" className="w-full border border-border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1" htmlFor="dateHomeownerNotified">
                  Date homeowner notified
                </label>
                <input id="dateHomeownerNotified" name="dateHomeownerNotified" type="date" className="w-full border border-border rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              {(["APPROVED", "CONDITIONAL_APPROVAL", "DENIED"] as const).map((d) => (
                <label key={d} className="flex items-center gap-1.5">
                  <input type="radio" name="decision" value={d} required />
                  {ARC_DECISION_LABELS[d]}
                </label>
              ))}
            </div>
            <textarea
              name="decisionReason"
              placeholder="Reason for decision"
              rows={3}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors">
              Save Decision
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
