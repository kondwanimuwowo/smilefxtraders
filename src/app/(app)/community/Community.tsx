"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { Panel, PanelHead, Avatar, DirPill, Chip, Icon, Button, EmptyState } from "@/components/ui";

// ── API types ─────────────────────────────────────────────────────────────────

interface ApiComment {
  id:         string;
  name:       string;
  avatarSeed: number;
  text:       string;
  time:       string;
}

interface ApiPost {
  id:           string;
  name:         string;
  handle:       string;
  avatarSeed:   number;
  isInstructor: boolean;
  pair:         string | null;
  dir:          string | null;
  result:       string | null;
  text:         string;
  time:         string;
  likes:        number;
  likedByMe:    boolean;
  comments:     number;
  commentList:  ApiComment[];
}

interface PostsPage {
  posts:      ApiPost[];
  nextCursor: string | null;
}

// ── Time formatter ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function usePosts() {
  return useInfiniteQuery<PostsPage>({
    queryKey: ["community-posts"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/community/posts?cursor=${encodeURIComponent(pageParam as string)}`
        : "/api/community/posts";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load posts");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

function useToggleLike(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Like failed");
      return res.json() as Promise<{ liked: boolean; likes: number }>;
    },
    onMutate: async () => {
      // Optimistic toggle
      qc.setQueryData<{ pages: PostsPage[] }>(["community-posts"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId
                ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
                : p
            ),
          })),
        };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["community-posts"] }),
  });
}

function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Comment failed");
      return res.json() as Promise<ApiComment>;
    },
    onSuccess: (comment) => {
      qc.setQueryData<{ pages: PostsPage[] }>(["community-posts"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId
                ? { ...p, comments: p.comments + 1, commentList: [...p.commentList, comment] }
                : p
            ),
          })),
        };
      });
    },
  });
}

function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { text: string; pair?: string; dir?: string; result?: string }) => {
      const res = await fetch("/api/community/posts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Post failed");
      return data as ApiPost;
    },
    onSuccess: (newPost) => {
      qc.setQueryData<{ pages: PostsPage[] }>(["community-posts"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: [{ posts: [newPost, ...(old.pages[0]?.posts ?? [])], nextCursor: old.pages[0]?.nextCursor ?? null }, ...old.pages.slice(1)],
        };
      });
    },
  });
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: ApiPost }) {
  const { user }               = useStore();
  const [commentOpen, setCommentOpen] = useState(false);
  const [draft, setDraft]             = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: toggleLike }  = useToggleLike(post.id);
  const { mutate: addComment }  = useAddComment(post.id);

  function submitComment() {
    const text = draft.trim();
    if (!text) return;
    addComment(text);
    setDraft("");
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--panel)",
        border: post.isInstructor ? "1px solid rgba(248,185,61,0.3)" : "1px solid var(--line)",
      }}
    >
      {post.isInstructor && (
        <div
          className="flex items-center gap-2 px-5 py-2 text-[11.5px] font-semibold"
          style={{ background: "rgba(248,185,61,0.08)", borderBottom: "1px solid rgba(248,185,61,0.2)", color: "var(--gold)" }}
        >
          <Icon name="workspace_premium" size={14} fill />
          Instructor post · Kondwani
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <Avatar seed={post.avatarSeed} name={post.name} size={38} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px]" style={{ color: "var(--ink-strong)" }}>{post.name}</span>
            {post.isInstructor && (
              <span className="material-symbols-rounded text-[15px]" style={{ color: "var(--gold)", fontVariationSettings: "'FILL' 1" }}>verified</span>
            )}
            <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>@{post.handle}</span>
            <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>· {relativeTime(post.time)}</span>
          </div>
          {(post.pair || post.result) && (
            <div className="flex items-center gap-2 mt-1">
              {post.pair && <span className="font-semibold text-[12.5px]" style={{ color: "var(--ink-strong)" }}>{post.pair}</span>}
              {post.dir  && <DirPill dir={post.dir.toLowerCase() as "long" | "short"} size="sm" />}
              {post.result === "WIN"  && <Chip tone="teal">Win</Chip>}
              {post.result === "LOSS" && <Chip tone="coral">Loss</Chip>}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-4">
        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>{post.text}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-5 py-3 border-t" style={{ borderColor: "var(--line)" }}>
        <button
          type="button"
          onClick={() => toggleLike()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-[var(--hover)]"
          style={{ color: post.likedByMe ? "var(--coral)" : "var(--ink-dim)" }}
        >
          <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: post.likedByMe ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          {post.likes}
        </button>

        <button
          type="button"
          onClick={() => { setCommentOpen((o) => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-[var(--hover)]"
          style={{ color: "var(--ink-dim)" }}
        >
          <Icon name="chat_bubble_outline" size={17} />
          {post.comments}
        </button>
      </div>

      {/* Comments */}
      {(commentOpen || post.commentList.length > 0) && (
        <div className="px-5 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          {post.commentList.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar seed={c.avatarSeed} name={c.name} size={28} />
              <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "var(--panel-2)" }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)" }}>{c.name}</span>
                  <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>{relativeTime(c.time)}</span>
                </div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>{c.text}</p>
              </div>
            </div>
          ))}

          {commentOpen && (
            <div className="flex items-center gap-2.5 mt-1">
              <Avatar seed={user?.avatarSeed ?? 99} name={user?.name ?? "You"} size={28} />
              <div
                className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent text-[12.5px] outline-none"
                  style={{ color: "var(--ink-strong)" }}
                />
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={!draft.trim()}
                  style={{ color: draft.trim() ? "var(--teal)" : "var(--ink-dim)" }}
                >
                  <Icon name="send" size={17} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compose ───────────────────────────────────────────────────────────────────

function ComposeBox() {
  const { user, toast }            = useStore();
  const { mutate: createPost, isPending, error } = useCreatePost();
  const [text, setText]            = useState("");

  function post() {
    const trimmed = text.trim();
    if (!trimmed) return;
    createPost({ text: trimmed }, {
      onSuccess: () => {
        setText("");
        toast("Post shared with the community", "teal", "send");
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Failed to post";
        if (msg.includes("Pro")) {
          toast("Community posting requires a Pro plan", "coral", "lock");
        } else {
          toast(msg, "coral", "error");
        }
      },
    });
  }

  return (
    <div className="rounded-2xl px-5 py-4" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
      <div className="flex items-start gap-3">
        <Avatar seed={user?.avatarSeed ?? 99} name={user?.name ?? "You"} size={36} />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share a trade idea, analysis, or lesson with the community…"
            rows={3}
            className="w-full bg-transparent text-[13.5px] resize-none outline-none leading-relaxed"
            style={{ color: "var(--ink-strong)" }}
          />
          {error instanceof Error && error.message.includes("Pro") && (
            <p className="text-[12px] mb-2" style={{ color: "var(--coral)" }}>
              Community posting requires a Pro plan.{" "}
              <a href="/pricing" style={{ color: "var(--teal)", textDecoration: "underline" }}>Upgrade</a>
            </p>
          )}
          <div className="flex items-center justify-end mt-2">
            <Button
              type="button"
              variant="primary"
              icon="send"
              disabled={!text.trim() || isPending}
              onClick={post}
            >
              {isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard sidebar (real data wired via Task #19) ─────────────────────────

function useLeaderboard() {
  return useQuery({
    queryKey: ["community-leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/community/leaderboard");
      if (!res.ok) return [] as LeaderEntry[];
      return res.json() as Promise<LeaderEntry[]>;
    },
  });
}

interface LeaderEntry {
  name:       string;
  handle:     string;
  avatarSeed: number;
  winRate:    number;
  netR:       string;
}

function Leaderboard() {
  const { data: leaders = [] } = useLeaderboard();
  const month = new Date().toLocaleString("en-US", { month: "long" });

  if (leaders.length === 0) return null;

  return (
    <Panel>
      <PanelHead title={`${month} leaderboard`} icon="leaderboard" />
      <div className="flex flex-col gap-2.5">
        {leaders.map((l, i) => (
          <div key={l.handle} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{
                background: i === 0 ? "var(--gold)" : i === 1 ? "rgba(154,208,206,0.3)" : "var(--panel-2)",
                color: i === 0 ? "var(--navy-deep)" : "var(--ink-dim)",
              }}
            >
              {i + 1}
            </div>
            <Avatar seed={l.avatarSeed} name={l.name} size={30} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold truncate" style={{ color: "var(--ink-strong)" }}>{l.name}</div>
              <div className="text-[11px]" style={{ color: "var(--ink-dim)" }}>{l.winRate}% win rate</div>
            </div>
            <span className="font-display font-bold text-[13px] tabular-nums" style={{ color: "var(--teal-bright)" }}>
              {l.netR}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Community stats (static — update from DB later if needed) ────────────────

function CommunityStats() {
  return (
    <Panel>
      <PanelHead title="Community stats" icon="groups" />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Members",       value: "2,418",  icon: "person"    },
          { label: "Trades logged", value: "14,832", icon: "menu_book" },
          { label: "Countries",     value: "12",     icon: "public"    },
          { label: "Win rate avg",  value: "58%",    icon: "percent"   },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-xl px-3 py-3 flex flex-col gap-1" style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}>
            <span className="material-symbols-rounded text-[16px]" style={{ color: "var(--teal)" }}>{icon}</span>
            <div className="font-display font-bold text-[18px]" style={{ color: "var(--ink-strong)" }}>{value}</div>
            <div className="text-[11px]" style={{ color: "var(--ink-dim)" }}>{label}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Community ─────────────────────────────────────────────────────────────────

export function Community() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts();
  const allPosts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <div className="view">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
            Community
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            Zambia&apos;s SMC trading community — share trades, analysis, and lessons.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5">
        {/* Feed */}
        <div className="flex flex-col gap-4">
          <ComposeBox />

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl h-32 animate-pulse" style={{ background: "var(--panel)", border: "1px solid var(--line)" }} />
              ))}
            </div>
          ) : allPosts.length === 0 ? (
            <EmptyState
              icon="groups"
              title="Nothing here yet"
              body="Be the first to share a trade idea with the community."
            />
          ) : (
            <>
              {allPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full py-3 rounded-2xl text-[13px] font-semibold transition-all"
                  style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--ink-mid)" }}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Leaderboard />
          <CommunityStats />

          <Panel>
            <PanelHead title="Community guidelines" icon="gavel" />
            <ul className="flex flex-col gap-2 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>
              {[
                "Post both wins AND losses — accountability drives improvement.",
                "Explain your reasoning, not just the direction.",
                "No signal selling or external promotions.",
                "Respect every level of experience.",
                "Tag your pair and direction when posting a trade.",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <Icon name="check" size={14} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 1 }} />
                  {rule}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
