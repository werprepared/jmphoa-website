"use client";

import { useState } from "react";
import { createCommentAction, deletePostAction } from "./actions";
import RichText from "@/components/RichText";

type Comment = { id: string; body: string; fileUrl: string | null; fileName: string | null; author: { name: string } };

type Post = {
  id: string;
  body: string;
  imageUrl: string | null;
  comments: Comment[];
};

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
    );
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = [parts[0], parts[parts.length - 1]]
    .filter(Boolean)
    .map((p) => p![0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-primary-light text-primary text-sm font-semibold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

export default function PostCard({
  post,
  authorName,
  authorPhotoUrl,
  categoryName,
  timeAgo,
  canDelete,
}: {
  post: Post;
  authorName: string;
  authorPhotoUrl: string | null;
  categoryName: string;
  timeAgo: string;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const replyCount = post.comments.length;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={authorName} photoUrl={authorPhotoUrl} />
          <div>
            <span className="font-medium text-navy">{authorName}</span>{" "}
            <span className="text-xs text-muted">{timeAgo}</span>
          </div>
        </div>
        {canDelete && (
          <form action={async () => { await deletePostAction(post.id); }}>
            <button className="text-xs text-muted hover:text-red-600">Delete</button>
          </form>
        )}
      </div>

      <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full">
        {categoryName}
      </span>
      <RichText html={post.body} className="mt-2" />
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="mt-3 rounded-lg max-h-96 object-cover" />
      )}

      <div className="mt-3 border-t border-border pt-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-sm text-primary font-medium hover:underline"
        >
          {expanded
            ? "▲ Less"
            : replyCount > 0
              ? `▼ More (${replyCount} repl${replyCount === 1 ? "y" : "ies"})`
              : "▼ Reply"}
        </button>

        {expanded && (
          <>
            {replyCount > 0 && (
              <div className="mt-3 space-y-2">
                {post.comments.map((c) => (
                  <div key={c.id} className="text-sm">
                    <span className="font-medium text-navy">{c.author.name}: </span>
                    <span>{c.body}</span>
                    {c.fileUrl && (
                      <a href={c.fileUrl} target="_blank" rel="noreferrer" className="ml-2 text-primary hover:underline">
                        📎 {c.fileName}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form action={createCommentAction.bind(null, post.id)} className="mt-3 flex flex-wrap gap-2 items-center">
              <input
                name="body"
                placeholder="Write a comment..."
                className="flex-1 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input type="file" name="file" className="text-xs" />
              <button className="text-sm text-primary font-medium">Reply</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
