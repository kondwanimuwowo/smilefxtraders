"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { Panel, PanelHead, Avatar, DirPill, Chip, Icon, Button, EmptyState, Select } from "@/components/ui";
import { useInstruments } from "@/lib/hooks/useInstruments";

// ── API types ─────────────────────────────────────────────────────────────────

interface ApiComment {
  id:         string;
  name:       string;
  avatarSeed: number;
  avatarUrl?: string | null;
  text:       string;
  time:       string;
}

interface ApiPost {
  id:           string;
  name:         string;
  handle:       string;
  avatarSeed:   number;
  avatarUrl?:   string | null;
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

import { fmtRelative } from "@/lib/date";
function relativeTime(iso: string): string { return fmtRelative(iso); }

// ── Feed filter ───────────────────────────────────────────────────────────────

type FeedFilter = "all" | "instructor" | "wins" | "losses";

const FILTER_TABS: { id: FeedFilter; label: string }[] = [
  { id: "all",        label: "All"        },
  { id: "instructor", label: "Instructor" },
  { id: "wins",       label: "Wins"       },
  { id: "losses",     label: "Losses"     },
];

function filterPosts(posts: ApiPost[], filter: FeedFilter): ApiPost[] {
  if (filter === "instructor") return posts.filter((p) => p.isInstructor);
  if (filter === "wins")       return posts.filter((p) => p.result === "WIN");
  if (filter === "losses")     return posts.filter((p) => p.result === "LOSS");
  return posts;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function usePosts() {
  return useInfiniteQuery<PostsPage>({
    queryKey: ["community-posts"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/community/posts?cursor=${encodeURIComponent(pageParam as string)}`
        : "/api/community/posts";
      let res: Response;
      try {
        res = await fetch(url);
      } catch {
        throw new Error("Can't reach the server. Check your internet connection.");
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Server error (${res.status})`);
      }
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
      let res: Response;
      try {
        res = await fetch("/api/community/posts", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
      } catch {
        throw new Error("Can't reach the server. Check your internet connection.");
      }
      const data = await res.json().catch(() => ({}) as Record<string, unknown>);
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `Server error (${res.status})`);
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
      className={`rounded-2xl overflow-hidden ${
        post.isInstructor
          ? "bg-[color-mix(in_srgb,var(--gold)_8%,transparent)] shadow-[0_0_0_2px_var(--gold)]"
          : "bg-panel shadow-md"
      }`}
    >
      {post.isInstructor && (
        <div className="flex items-center gap-2 px-5 py-2 text-[11.5px] font-semibold bg-[rgba(248,185,61,0.08)] text-gold">
          <Icon name="workspace_premium" size={14} fill />
          Instructor post · Kondwani
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <Avatar src={post.avatarUrl ?? undefined} seed={post.avatarSeed} name={post.name} size={38} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px] text-ink-strong">{post.name}</span>
            {post.isInstructor && (
              <Icon name="verified" size={15} className="text-gold" />
            )}
            <span className="text-[12px] text-ink-dim">@{post.handle}</span>
            <span className="text-[12px] text-ink-dim">· {relativeTime(post.time)}</span>
          </div>
          {(post.pair || post.result) && (
            <div className="flex items-center gap-2 mt-1">
              {post.pair && <span className="font-semibold text-[12.5px] text-ink-strong">{post.pair}</span>}
              {post.dir  && <DirPill dir={post.dir.toLowerCase() as "long" | "short"} size="sm" />}
              {post.result === "WIN"  && <Chip tone="teal">Win</Chip>}
              {post.result === "LOSS" && <Chip tone="coral">Loss</Chip>}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-4">
        <p className="text-[13.5px] leading-relaxed text-ink-mid">{post.text}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-5 py-3">
        <button
          type="button"
          onClick={() => toggleLike()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-hover ${post.likedByMe ? "text-teal" : "text-ink-dim"}`}
        >
          <Icon name="favorite" size={18} />
          {post.likes}
        </button>

        <button
          type="button"
          onClick={() => { setCommentOpen((o) => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors hover:bg-hover ${commentOpen ? "text-teal" : "text-ink-dim"}`}
        >
          <Icon name="chat_bubble_outline" size={17} />
          {post.comments}
        </button>
      </div>

      {/* Comments */}
      {(commentOpen || post.commentList.length > 0) && (
        <div className="px-5 pb-4 pt-3 flex flex-col gap-3">
          {post.commentList.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar src={c.avatarUrl ?? undefined} seed={c.avatarSeed} name={c.name} size={28} />
              <div className="flex-1 rounded-xl px-3 py-2 bg-panel-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-semibold text-ink-strong">{c.name}</span>
                  <span className="text-[11px] text-ink-dim">{relativeTime(c.time)}</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-mid">{c.text}</p>
              </div>
            </div>
          ))}

          {commentOpen && (
            <div className="flex items-center gap-2.5 mt-1">
              <Avatar src={user?.avatarUrl} seed={user?.avatarSeed ?? 99} name={user?.name ?? "You"} size={28} />
              <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2 bg-panel-2 border border-line">
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent text-[12.5px] outline-none text-ink-strong"
                />
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={!draft.trim()}
                  className={draft.trim() ? "text-teal" : "text-ink-dim"}
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

const PAIR_OPTIONS_FALLBACK = [
  { v: "",        l: "Tag pair…"  },
  { header: "Majors"              },
  { v: "EURUSD",  l: "EURUSD"    },
  { v: "GBPUSD",  l: "GBPUSD"    },
  { v: "USDJPY",  l: "USDJPY"    },
  { v: "USDCHF",  l: "USDCHF"    },
  { v: "AUDUSD",  l: "AUDUSD"    },
  { v: "NZDUSD",  l: "NZDUSD"    },
  { v: "USDCAD",  l: "USDCAD"    },
  { header: "Metals & Indices"    },
  { v: "XAUUSD",  l: "XAUUSD"    },
  { v: "NAS100",  l: "NAS100"    },
];

function TogglePill({
  active, activeClass, children, onClick,
}: {
  active: boolean;
  activeClass: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-all ${
        active ? activeClass : "bg-panel-2 text-ink-dim shadow-sm"
      }`}
    >
      {children}
    </button>
  );
}

function ComposeBox() {
  const { user, toast }            = useStore();
  const { mutate: createPost, isPending, error } = useCreatePost();
  const { data: instruments = [] } = useInstruments();
  const pairOptions = instruments.length
    ? [{ v: "", l: "Tag pair…" }, ...instruments.map((i) => ({ v: i.symbol, l: i.symbol }))]
    : PAIR_OPTIONS_FALLBACK;
  const [text, setText]            = useState("");
  const [pair, setPair]            = useState("");
  const [dir, setDir]              = useState<"" | "long" | "short">("");
  const [result, setResult]        = useState<"" | "WIN" | "LOSS">("");
  function post() {
    const trimmed = text.trim();
    if (!trimmed) return;
    createPost(
      { text: trimmed, pair: pair || undefined, dir: dir || undefined, result: result || undefined },
      {
        onSuccess: () => {
          setText(""); setPair(""); setDir(""); setResult("");
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
      }
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-panel shadow-md">
      {/* Writing area */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="shrink-0 mt-1">
          <Avatar src={user?.avatarUrl} seed={user?.avatarSeed ?? 99} name={user?.name ?? "You"} size={34} />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share a trade idea, analysis, or lesson…"
          rows={3}
          className="flex-1 rounded-xl px-3.5 py-2.5 mt-2 text-[13.5px] resize-none outline-none leading-relaxed placeholder:text-[var(--ink-dim)] bg-panel-2 text-ink-strong"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-5 py-3 flex-wrap">
        {/* Pair picker */}
        <div className="w-[130px]">
          <Select
            compact
            value={pair}
            placeholder="Tag pair…"
            options={pairOptions}
            onChange={(v) => { setPair(v); if (!v) { setDir(""); setResult(""); } }}
          />
        </div>

        {/* Direction + result tags — only visible once a pair is selected */}
        {pair && (
          <>
            <div className="w-px h-4 shrink-0 bg-line" />
            <TogglePill
              active={dir === "long"}
              activeClass="bg-[rgba(8,174,170,0.15)] text-teal shadow-[0_0_0_2px_var(--teal)]"
              onClick={() => setDir(dir === "long" ? "" : "long")}
            >
              Long
            </TogglePill>
            <TogglePill
              active={dir === "short"}
              activeClass="bg-[rgba(234,82,61,0.12)] text-coral shadow-[0_0_0_2px_var(--coral)]"
              onClick={() => setDir(dir === "short" ? "" : "short")}
            >
              Short
            </TogglePill>
            <div className="w-px h-4 shrink-0 bg-line" />
            <TogglePill
              active={result === "WIN"}
              activeClass="bg-[rgba(8,174,170,0.12)] text-teal-bright shadow-[0_0_0_2px_var(--teal)]"
              onClick={() => setResult(result === "WIN" ? "" : "WIN")}
            >
              Win
            </TogglePill>
            <TogglePill
              active={result === "LOSS"}
              activeClass="bg-[rgba(234,82,61,0.1)] text-coral shadow-[0_0_0_2px_var(--coral)]"
              onClick={() => setResult(result === "LOSS" ? "" : "LOSS")}
            >
              Loss
            </TogglePill>
          </>
        )}

        <div className="flex-1" />

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

      {error instanceof Error && error.message.includes("Pro") && (
        <div className="px-5 pb-3 text-[12px] text-coral">
          Community posting requires a Pro plan.{" "}
          <a href="/membership" className="text-teal underline">Upgrade</a>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard sidebar ────────────────────────────────────────────────────────

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
  avatarUrl:  string | null;
  winRate:    number;
  netR:       string;
}

function Leaderboard() {
  const { data: leaders = [], isLoading } = useLeaderboard();
  const month = new Date().toLocaleString("en-US", { month: "long" });

  return (
    <Panel>
      <PanelHead title={`${month} leaderboard`} icon="leaderboard" />
      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 rounded-full shrink-0 bg-track" />
              <div className="w-8 h-8 rounded-full shrink-0 bg-track" />
              <div className="flex-1">
                <div className="h-3 w-24 rounded mb-1.5 bg-track" />
                <div className="h-2.5 w-16 rounded bg-track" />
              </div>
            </div>
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <p className="text-[12.5px] text-ink-dim">
          No trades logged yet this month.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {leaders.map((l, i) => (
            <div key={l.handle} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  i === 0 ? "bg-gold text-navy-deep" : i === 1 ? "bg-[rgba(154,208,206,0.3)] text-ink-dim" : "bg-panel-2 text-ink-dim"
                }`}
              >
                {i + 1}
              </div>
              <Avatar src={l.avatarUrl ?? undefined} seed={l.avatarSeed} name={l.name} size={30} />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold truncate text-ink-strong">{l.name}</div>
                <div className="text-[11px] text-ink-dim">{l.winRate}% win rate</div>
              </div>
              <span className="font-display font-bold text-[13px] tabular-nums text-teal-bright">
                {l.netR}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ── Community stats ───────────────────────────────────────────────────────────

interface CommunityStatsData { members: number; tradesLogged: number; countries: number; avgWinRate: number }

function useCommunityStats() {
  return useQuery<CommunityStatsData>({
    queryKey: ["community-stats"],
    queryFn: () => fetch("/api/community/stats").then((r) => r.json()),
    staleTime: 15 * 60 * 1000,
  });
}

function CommunityStats() {
  const { data } = useCommunityStats();
  const stats = [
    { label: "Members",       value: data ? data.members.toLocaleString()       : "—", icon: "person"    },
    { label: "Trades logged", value: data ? data.tradesLogged.toLocaleString()  : "—", icon: "menu_book" },
    { label: "Countries",     value: data ? String(data.countries)               : "—", icon: "public"    },
    { label: "Win rate avg",  value: data ? data.avgWinRate + "%"               : "—", icon: "percent"   },
  ];
  return (
    <Panel>
      <PanelHead title="Community stats" icon="groups" />
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="rounded-xl px-3 py-3 flex flex-col gap-1 bg-panel-2 shadow-sm">
            <Icon name={icon} size={16} className="text-teal" />
            <div className="font-display font-bold text-[18px] text-ink-strong">{value}</div>
            <div className="text-[11px] text-ink-dim">{label}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Community ─────────────────────────────────────────────────────────────────

export function Community() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = usePosts();
  const allPosts = data?.pages.flatMap((p) => p.posts) ?? [];
  const filtered = filterPosts(allPosts, filter);

  return (
    <div className="view">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">
            Community
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Zambia&apos;s SMC trading community: share trades, analysis, and lessons.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5">
        {/* Feed */}
        <div className="flex flex-col gap-4">
          <ComposeBox />

          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all ${
                  filter === tab.id
                    ? "bg-[rgba(8,174,170,0.12)] text-teal shadow-[0_0_0_2px_var(--teal)]"
                    : "bg-transparent text-ink-dim"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error instanceof Error ? (
            <div className="rounded-2xl px-5 py-10 text-center bg-panel shadow-md">
              <Icon name="wifi_off" size={28} className="text-ink-dim mb-2" />
              <p className="text-[13px] font-medium mb-1 text-ink-strong">Could not load posts</p>
              <p className="text-[12.5px] text-ink-dim">{error.message}</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl h-36 animate-pulse bg-panel shadow-md" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="groups"
              title={filter === "all" ? "Nothing here yet" : `No ${filter} posts yet`}
              body={filter === "all"
                ? "Be the first to share a trade idea with the community."
                : "Try a different filter or check back later."}
            />
          ) : (
            <>
              {filtered.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {hasNextPage && filter === "all" && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full py-3 rounded-2xl text-[13px] font-semibold transition-all bg-panel shadow-sm text-ink-mid"
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
            <ul className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-ink-mid">
              {[
                "Post both wins AND losses. Accountability drives improvement.",
                "Explain your reasoning, not just the direction.",
                "No signal selling or external promotions.",
                "Respect every level of experience.",
                "Tag your pair and direction when posting a trade.",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <Icon name="check" size={14} className="text-teal shrink-0 mt-px" />
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
