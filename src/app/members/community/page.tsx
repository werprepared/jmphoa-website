import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import NewPostForm from "./NewPostForm";
import { createCommentAction, deletePostAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const user = await requireApprovedUser();
  const posts = await prisma.communityPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      comments: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
    take: 50,
  });

  return (
    <div>
      <PageHeader title="Community Wall" subtitle="Share news, ask questions, and connect with your neighbors." />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <NewPostForm />

        {posts.length === 0 && <p className="text-muted text-center">Be the first to post!</p>}

        <div className="space-y-6">
          {posts.map((post) => {
            const canDelete = post.authorId === user.id || user.role === "ADMIN";
            return (
              <div key={post.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-navy">{post.author.name}</span>{" "}
                    <span className="text-xs text-muted">
                      {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  {canDelete && (
                    <form
                      action={async () => {
                        "use server";
                        await deletePostAction(post.id);
                      }}
                    >
                      <button className="text-xs text-muted hover:text-red-600">Delete</button>
                    </form>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap">{post.body}</p>
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt="" className="mt-3 rounded-lg max-h-96 object-cover" />
                )}

                {post.comments.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    {post.comments.map((c) => (
                      <div key={c.id} className="text-sm">
                        <span className="font-medium text-navy">{c.author.name}: </span>
                        <span>{c.body}</span>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await createCommentAction(post.id, formData);
                  }}
                  className="mt-3 flex gap-2"
                >
                  <input
                    name="body"
                    placeholder="Write a comment..."
                    className="flex-1 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button className="text-sm text-primary font-medium">Reply</button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
