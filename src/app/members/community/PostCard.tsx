"use client";

import { useActionState, useState } from "react";
import { createCommentAction, deletePostAction, updatePostAction, type PostState } from "./actions";
import RichText from "@/components/RichText";
import RichTextEditor from "@/components/RichTextEditor";

type Comment = { id: string; body: string; fileUrl: string | null; fileName: string | null; author: { name: string } };

type Category = { id: string; name: string };

type Post = {
  id: string;
  body: string;
  imageUrl: string | null;
  categoryId: string | null;
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
  categories,
  authorName,
  authorPhotoUrl,
  categoryName,
  timeAgo,
  canManage,
}: {
  post: Post;
  categories: Category[];
  authorName: string;
  authorPhotoUrl: string | null;
  categoryName: string;
  timeAgo: string;
  canManage: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const replyCount = post.comments.length;

  const [state, formAction, pending] = useActionState<PostState, FormData>(async (prev, fd) => {
    const result = await updatePostAction(post.id, prev, fd);
    if (!result?.error) setEditing(false);
    return result;
  }, undefined);

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
        {canManage && !editing && (
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(true)} className="text-xs text-muted hover:text-primary">
              Edit
            </button>
            <form action={async () => { await deletePostAction(post.id); }}>
              <button className="text-xs text-muted hover:text-red-600">Delete</button>
            </form>
          </div>
        )}
      </div>

      {editing ? (
        <form action={formAction} className="mt-2 space-y-2">
          <select
            name="categoryId"
            required
            defaultValue={post.categoryId ?? ""}
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>
              Choose a category...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <RichTextEditor name="body" defaultValue={post.body} />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-muted hover:text-navy px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full">
            {categoryName}
          </span>
          <RichText html={post.body} className="mt-2" />
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="mt-3 rounded-lg max-h-96 object-cover" />
          )}
        </>
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
