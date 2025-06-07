// pages/communities/[id].jsx

import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import prisma from "../../lib/prisma";
import { getUserFromToken } from "../../lib/auth";
import GroupHeader from "../../components/GroupHeader";
import GroupPostModal from "../../components/GroupPostModal";
import GroupPostList from "../../components/GroupPostList";
import { PlusIcon } from "lucide-react";

export async function getServerSideProps(context) {
  const groupId = context.params.id;

  // 1) Fetch group by ID
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      description: true,
      avatarUrl: true,
      members: { select: { userId: true } },
    },
  });

  if (!group) {
    return { notFound: true };
  }

  // 2) Check if current user is a member
  let isMember = false;
  let viewer = null;
  try {
    viewer = await getUserFromToken(context.req);
    if (viewer) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: viewer.id,
            groupId: groupId,
          },
        },
      });
      isMember = !!membership;
    }
  } catch {
    isMember = false;
  }

  // If not a member, redirect back to /communities
  if (!isMember) {
    return {
      redirect: {
        destination: "/communities",
        permanent: false,
      },
    };
  }

  // 3) Fetch the group’s posts (latest 10)
  const rawPosts = await prisma.post.findMany({
    where: { groupId: groupId },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, isPractitioner: true },
      },
      mediaAssets: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // 4) Determine which of these the viewer has liked
  let likedSet = new Set();
  if (viewer) {
    const postIds = rawPosts.map((p) => p.id);
    const likedMap = await prisma.like.findMany({
      where: {
        userId: viewer.id,
        postId: { in: postIds },
      },
      select: { postId: true },
    });
    likedSet = new Set(likedMap.map((l) => l.postId));
  }

  // 5) Serialize each post (convert Date → ISO) & mark likedByCurrentUser
  const posts = rawPosts.map((p) => ({
    id: p.id,
    author: {
      id: p.author.id,
      name: p.author.name,
      avatarUrl: p.author.avatarUrl,
      isPractitioner: p.author.isPractitioner,
    },
    mediaAssets: p.mediaAssets.map((a) => ({
      id: a.id,
      url: a.url,
      type: a.type,
      width: a.width,
      height: a.height,
      durationSec: a.durationSec,
      createdAt: a.createdAt.toISOString(),
    })),
    textContent: p.textContent,
    type: p.type,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    likedByCurrentUser: likedSet.has(p.id),
  }));

  return {
    props: {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        avatarUrl: group.avatarUrl,
        memberCount: group.members.length,
      },
      initialPosts: posts,
      viewerId: viewer ? viewer.id : null,
    },
  };
}

export default function CommunityDetail({ group, initialPosts, viewerId }) {
  const router = useRouter();
  const { id: groupId } = router.query;

  // local state for the post list:
  const [posts, setPosts] = useState(initialPosts);

  // state to control our “group post” modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <>
      <Head>
        <title>{group.name} – Community</title>
      </Head>

      <div className="max-w-2xl mx-auto py-8">
        {/* — Group Header — */}
        <GroupHeader
          avatarUrl={group.avatarUrl}
          name={group.name}
          description={group.description}
          memberCount={group.memberCount}
        />

        {/* — List of existing posts in this group — */}
        <GroupPostList posts={posts} />
      </div>

      {/* — Floating “+” on the community page (desktop & mobile) — */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-40"
        aria-label="Create new community post"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* — “Create Post” modal for this community — */}
      <GroupPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        groupId={groupId}
        onPostCreated={handlePostCreated}
      />
    </>
  );
}
