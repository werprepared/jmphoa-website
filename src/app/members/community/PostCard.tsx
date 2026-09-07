"use client";

import { useState } from "react";
import { createCommentAction, deletePostAction } from "./actions";

type Comment = { id: string; body: string; author: { name: string } };

type Post = {
  id: string;
  subject: string;
  body: string;
  imageUrl: string | null;
  comments: Comment[];
};

export default function PostCard({
  post,
  authorName,
  timeAgo,
  canDelete,
}: {
  post: Post;
  authorName: string;
  timeAgo: string;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const replyCount = post.comments.length;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-navy">{authorName}</span>{" "}
          <span className="text-xs text-muted">{timeAgo}</span>
        </div>
        {canDelete && (
          <form action={async () => { await deletePostAction(post.id); }}>
            <button className="text-xs text-muted hover:text-red-600">Delete</button>
          </form>
        )}
      </div>

      {post.subject && <h3 className="font-semibold text-navy mt-1">{post.subject}</h3>}
      <p className="mt-2 whitespace-pre-wrap">{post.body}</p>
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
                  </div>
                ))}
              </div>
            )}

            <form action={createCommentAction.bind(null, post.id)} className="mt-3 flex gap-2">
              <input
                name="body"
                placeholder="Write a comment..."
                className="flex-1 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="text-sm text-primary font-medium">Reply</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
