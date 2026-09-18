"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser, requireRole } from "@/lib/authz";
import { canDecideArcRequests } from "@/lib/roles";
import { saveDocument, UploadError } from "@/lib/upload";
import { sendMail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/notify";
import { arcFolderLabel, ARC_DECISION_LABELS, ARC_MIN_START_DAYS } from "@/lib/arc";
import { startOfTodayLocal } from "@/lib/format";
import type { ArcAttachmentLabel, ArcDecision, ArcRequestType } from "@prisma/client";

function str(formData: FormData, name: string) {
  const s = (formData.get(name) ?? "").toString().trim();
  return s.length ? s : null;
}

const ATTACHMENT_FIELDS: { field: string; label: ArcAttachmentLabel }[] = [
  { field: "survey", label: "SURVEY" },
  { field: "photos", label: "PHOTOS" },
  { field: "plans", label: "PLANS" },
  { field: "landscaping", label: "LANDSCAPING" },
];

async function saveAttachments(arcRequestId: string, uploadedById: string, formData: FormData, fields: { field: string; label: ArcAttachmentLabel }[]) {
  for (const { field, label } of fields) {
    const files = formData.getAll(field);
    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;
      try {
        const fileUrl = await saveDocument(file);
        await prisma.arcAttachment.create({
          data: { arcRequestId, label, fileUrl, fileName: file.name, uploadedById },
        });
      } catch (err) {
        console.error("ARC attachment upload failed:", err);
      }
    }
  }
}

/** Emails every approved Architecture Committee member (and Admins). */
async function notifyArcCommittee({ subject, text }: { subject: string; text: string }) {
  const committee = await prisma.user.findMany({
    where: { status: "APPROVED", roles: { some: { role: { in: ["COMMITTEE_ARCH", "ADMIN"] } } } },
    select: { email: true },
  });
  await Promise.all(committee.map((u) => sendMail({ to: u.email, subject, text })));
}

export type CreateArcRequestState = { error?: string } | undefined;

export async function createArcRequestAction(_prev: CreateArcRequestState, formData: FormData): Promise<CreateArcRequestState> {
  const user = await requireApprovedUser();

  const requesterName = str(formData, "requesterName");
  const requesterAddress = str(formData, "requesterAddress");
  const requesterEmail = str(formData, "requesterEmail");
  const requestType = formData.get("requestType") as ArcRequestType | null;
  if (!requesterName || !requesterAddress || !requesterEmail) {
    return { error: "Please fill in your name, address, and email." };
  }
  if (!requestType) return { error: "Please select the type of requested change." };
  if (requestType === "OTHER" && !str(formData, "requestTypeOther")) {
    return { error: "Please describe the requested change." };
  }

  const startDateRaw = str(formData, "startDate");
  let startDate: Date | null = null;
  if (startDateRaw) {
    startDate = new Date(startDateRaw);
    const minStart = startOfTodayLocal();
    minStart.setDate(minStart.getDate() + ARC_MIN_START_DAYS);
    if (startDate < minStart) {
      return { error: `The starting date must be at least ${ARC_MIN_START_DAYS} days after submitting this application.` };
    }
  }
  const completionDateRaw = str(formData, "completionDate");
  const completionDate = completionDateRaw ? new Date(completionDateRaw) : null;

  const sequenceNumber = (await prisma.arcRequest.count({ where: { requesterId: user.id } })) + 1;

  const request = await prisma.arcRequest.create({
    data: {
      requesterId: user.id,
      sequenceNumber,
      requesterName,
      requesterAddress,
      requesterPhone: str(formData, "requesterPhone"),
      requesterEmail,
      requestType,
      requestTypeOther: requestType === "OTHER" ? str(formData, "requestTypeOther") : null,
      locationOnProperty: str(formData, "locationOnProperty"),
      sizeDimensions: str(formData, "sizeDimensions"),
      color: str(formData, "color"),
      materials: str(formData, "materials"),
      startDate,
      completionDate,
      contractorName: str(formData, "contractorName"),
      contractorAddress: str(formData, "contractorAddress"),
      contractorPhone: str(formData, "contractorPhone"),
    },
  });

  await saveAttachments(request.id, user.id, formData, ATTACHMENT_FIELDS);

  await notifyArcCommittee({
    subject: `New ARC request: ${arcFolderLabel(request)}`,
    text: `${user.name} submitted a new Architecture Review Committee request.\n\nView it: ${SITE_URL}/members/arc-requests/${request.id}`,
  });

  revalidatePath("/members/arc-requests");
  redirect(`/members/arc-requests/${request.id}`);
}

export async function addArcAttachmentAction(id: string, formData: FormData) {
  const user = await requireApprovedUser();
  const request = await prisma.arcRequest.findUnique({ where: { id } });
  if (!request) return;

  const isOwner = request.requesterId === user.id;
  const isCommittee = canDecideArcRequests(user.roles);
  if (!isOwner && !isCommittee) throw new Error("You don't have permission to add documents to this request.");

  const label: ArcAttachmentLabel = isCommittee && !isOwner ? "COMMITTEE_RESPONSE" : "OTHER";
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      const fileUrl = await saveDocument(file);
      await prisma.arcAttachment.create({
        data: { arcRequestId: id, label, fileUrl, fileName: file.name, uploadedById: user.id },
      });

      if (request.status === "PROCESSING") {
        await notifyArcCommittee({
          subject: `ARC request updated: ${arcFolderLabel(request)}`,
          text: `${user.name} added a document ("${file.name}") to an in-process Architecture Review Committee request.\n\nView it: ${SITE_URL}/members/arc-requests/${id}`,
        });
      }
    } catch (err) {
      if (!(err instanceof UploadError)) throw err;
    }
  }

  revalidatePath(`/members/arc-requests/${id}`);
  revalidatePath("/members/arc-requests");
}

export async function decideArcRequestAction(id: string, formData: FormData) {
  const user = await requireRole("ADMIN", "COMMITTEE_ARCH");
  const request = await prisma.arcRequest.findUnique({ where: { id }, include: { requester: true } });
  if (!request) return;

  const decision = formData.get("decision") as ArcDecision | null;
  if (!decision) return;

  const dateReviewedRaw = str(formData, "dateReviewed");
  const dateNotifiedRaw = str(formData, "dateHomeownerNotified");

  await prisma.arcRequest.update({
    where: { id },
    data: {
      status: "COMPLETED",
      decision,
      decisionReason: str(formData, "decisionReason"),
      dateReviewed: dateReviewedRaw ? new Date(dateReviewedRaw) : startOfTodayLocal(),
      dateHomeownerNotified: dateNotifiedRaw ? new Date(dateNotifiedRaw) : startOfTodayLocal(),
      decidedById: user.id,
    },
  });

  const label = arcFolderLabel(request);
  await sendMail({
    to: request.requester.email,
    subject: `Decision on your ARC request: ${ARC_DECISION_LABELS[decision]}`,
    text: `Your Architecture Review Committee request (${label}) has been marked ${ARC_DECISION_LABELS[decision]}.\n\nView details: ${SITE_URL}/members/arc-requests/${id}`,
  });

  revalidatePath(`/members/arc-requests/${id}`);
  revalidatePath("/members/arc-requests");
}
