"use client";

import { useActionState, useState } from "react";
import type { SurveyVote } from "@prisma/client";
import { submitVoteAction, deleteSurveyAction, deleteResponseAction, type SurveyState } from "./actions";
import { SURVEY_VOTE_OPTIONS, SURVEY_VOTE_LABELS, SURVEY_VOTE_SHORT_LABELS, SURVEY_VOTE_COLORS } from "@/lib/survey";

type ResponseRow = { id: string; voterName: string; vote: SurveyVote; points: number; comment: string | null };

const BAR_MAX_HEIGHT = 28;
const RESPONSES_PER_PAGE = 10;

function ResultsBarChart({ responses }: { responses: ResponseRow[] }) {
  const counts = SURVEY_VOTE_OPTIONS.map((o) => responses.filter((r) => r.vote === o.value).length);
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="flex items-end gap-1">
      {SURVEY_VOTE_OPTIONS.map((o, i) => {
        const count = counts[i];
        const height = count === 0 ? 2 : Math.max(3, Math.round((count / maxCount) * BAR_MAX_HEIGHT));
        return (
          <div
            key={o.value}
            className="flex flex-col items-center justify-end"
            style={{ height: BAR_MAX_HEIGHT + 12 }}
            title={`${o.label}: ${count}`}
          >
            <div className={`w-2.5 rounded-t-sm ${SURVEY_VOTE_COLORS[o.value]}`} style={{ height }} />
            <span className="text-[9px] text-muted leading-none mt-0.5">{SURVEY_VOTE_SHORT_LABELS[o.value]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function SurveyCard({
  survey,
  myResponse,
  canDelete,
}: {
  survey: {
    id: string;
    title: string;
    description: string | null;
    attachmentUrl: string | null;
    attachmentName: string | null;
    createdByName: string;
    responses: ResponseRow[];
  };
  myResponse: { vote: SurveyVote; comment: string | null } | null;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(0);

  const [state, formAction, pending] = useActionState<SurveyState, FormData>(async (prev, fd) => {
    const result = await submitVoteAction(survey.id, prev, fd);
    if (!result?.error) setEditing(false);
    return result;
  }, undefined);

  const totalPoints = survey.responses.reduce((sum, r) => sum + r.points, 0);
  const responseCount = survey.responses.length;
  const showForm = !myResponse || editing;
  const isImageAttachment = !!survey.attachmentUrl && /\.(jpe?g|png)$/i.test(survey.attachmentUrl);

  const totalPages = Math.max(1, Math.ceil(responseCount / RESPONSES_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const pagedResponses = survey.responses.slice(
    currentPage * RESPONSES_PER_PAGE,
    currentPage * RESPONSES_PER_PAGE + RESPONSES_PER_PAGE
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-navy">{survey.title}</h3>
          {survey.description && <p className="text-sm text-muted mt-1">{survey.description}</p>}
          {survey.attachmentUrl && (
            <div className="mt-2">
              {isImageAttachment ? (
                <a href={survey.attachmentUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={survey.attachmentUrl} alt={survey.attachmentName ?? "Attachment"} className="max-h-64 rounded-lg border border-border" />
                </a>
              ) : (
                <a
                  href={survey.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  📎 {survey.attachmentName ?? "View attachment"}
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-muted mt-1">Created by {survey.createdByName}</p>
        </div>
        {canDelete && (
          <form action={async () => { await deleteSurveyAction(survey.id); }}>
            <button className="text-xs text-muted hover:text-red-600 shrink-0">Delete survey</button>
          </form>
        )}
      </div>

      {showForm ? (
        <form action={formAction} className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SURVEY_VOTE_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="vote" value={o.value} required defaultChecked={myResponse?.vote === o.value} />
                {o.label}
              </label>
            ))}
          </div>
          <input
            name="comment"
            placeholder="Add a comment (optional)"
            defaultValue={myResponse?.comment ?? ""}
            className="w-full border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-1.5 rounded transition-colors disabled:opacity-60"
            >
              {pending ? "Submitting..." : myResponse ? "Update response" : "Submit response"}
            </button>
            {myResponse && (
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted hover:text-navy">
                Cancel
              </button>
            )}
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      ) : (
        <div className="mt-3 text-sm bg-primary-light rounded px-3 py-2">
          You responded: <span className="font-medium">{myResponse && SURVEY_VOTE_LABELS[myResponse.vote]}</span>
          {myResponse?.comment && <div className="mt-1 text-muted">&ldquo;{myResponse.comment}&rdquo;</div>}
          <button onClick={() => setEditing(true)} className="block mt-1 text-primary hover:underline text-xs">
            Change your response
          </button>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted whitespace-nowrap">
            {responseCount} response{responseCount === 1 ? "" : "s"} &middot; {totalPoints} point{totalPoints === 1 ? "" : "s"}
          </span>
          {responseCount > 0 && <ResultsBarChart responses={survey.responses} />}
        </div>
        <button
          onClick={() => {
            setExpanded((v) => !v);
            setPage(0);
          }}
          className="text-sm text-primary font-medium hover:underline"
        >
          {expanded ? "▲ Hide responses" : "▼ Show responses"}
        </button>
      </div>

      {expanded && (
        <>
          <ul className="mt-3 space-y-2">
            {survey.responses.length === 0 ? (
              <p className="text-sm text-muted">No responses yet.</p>
            ) : (
              pagedResponses.map((r) => (
                <li
                  key={r.id}
                  className="text-sm bg-white border border-border rounded px-3 py-2 flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-medium text-navy">{r.voterName}</span>: {SURVEY_VOTE_LABELS[r.vote]} (
                    {r.points > 0 ? "+" : ""}
                    {r.points})
                    {r.comment && <div className="text-muted mt-0.5">&ldquo;{r.comment}&rdquo;</div>}
                  </div>
                  {canDelete && (
                    <form action={async () => { await deleteResponseAction(r.id); }}>
                      <button className="text-xs text-muted hover:text-red-600 shrink-0">Delete</button>
                    </form>
                  )}
                </li>
              ))
            )}
          </ul>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="text-sm text-primary font-medium hover:underline disabled:text-muted disabled:no-underline disabled:cursor-default"
              >
                ← Previous
              </button>
              <span className="text-xs text-muted">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="text-sm text-primary font-medium hover:underline disabled:text-muted disabled:no-underline disabled:cursor-default"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
