import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import NewPostForm from "./NewPostForm";
import PostCard from "./PostCard";

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
            const canDelete = post.authorId === user.id || user.roles.includes("ADMIN");
            return (
              <PostCard
                key={post.id}
                post={post}
                authorName={post.author.name}
                timeAgo={formatDistanceToNow(post.createdAt, { addSuffix: true })}
                canDelete={canDelete}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
