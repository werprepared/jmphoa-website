import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import NewPostForm from "./NewPostForm";
import PostCard from "./PostCard";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await requireApprovedUser();
  const { category: selectedCategory } = await searchParams;

  const [categories, posts] = await Promise.all([
    prisma.communityCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.communityPost.findMany({
      where: selectedCategory ? { categoryId: selectedCategory } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        author: { include: { profile: true } },
        category: true,
        comments: { orderBy: { createdAt: "asc" }, include: { author: true } },
      },
      take: 50,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Community Wall" subtitle="Share news, ask questions, and connect with your neighbors." />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <NewPostForm categories={categories} />

        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/members/community"
            className={`text-sm px-3 py-1.5 rounded-full border ${
              !selectedCategory ? "bg-primary text-white border-primary" : "border-border text-navy hover:border-primary"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/members/community?category=${c.id}`}
              className={`text-sm px-3 py-1.5 rounded-full border ${
                selectedCategory === c.id ? "bg-primary text-white border-primary" : "border-border text-navy hover:border-primary"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {posts.length === 0 && <p className="text-muted text-center">Be the first to post!</p>}

        <div className="space-y-6">
          {posts.map((post) => {
            const canDelete = post.authorId === user.id || user.roles.includes("ADMIN");
            return (
              <PostCard
                key={post.id}
                post={post}
                authorName={post.author.name}
                authorPhotoUrl={post.author.profile?.photoUrl ?? null}
                categoryName={post.category?.name ?? "Uncategorized"}
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
