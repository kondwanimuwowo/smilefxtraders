"use client";

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Direction = "long" | "short";
export type TradeResult = "win" | "loss" | "open";
export type ToastTone = "teal" | "gold" | "coral";

export interface AIReviewResult {
  grade:   string;
  verdict: string;
  good:    string[];
  improve: string[];
  tip:     string;
}

export interface Trade {
  id: string;
  date: string;       // short display: "Jun 12"
  openedAt?: string;  // full ISO datetime of entry
  closedAt?: string;  // full ISO datetime of exit
  pair: string;
  dir: Direction;
  model: string;
  framework?: string;
  session?: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  closePrice?: number;
  rr?: number;
  pnlR: number;
  riskPct?: number;
  result: TradeResult;
  rating?: number;
  discipline: boolean;
  tags: string[];
  mistake?: string;
  note?: string;
  chartUrl?: string;
  fromAlert?: string;
  aiReview?: AIReviewResult | null;
}

export interface FeedPost {
  id: string;
  name: string;
  handle: string;
  time: string;
  avatarSeed?: number;
  pair?: string;
  dir?: Direction;
  text: string;
  likes: number;
  comments: number;
  commentList: { name: string; text: string; time: string }[];
  result?: string | null;
}

export interface Notif {
  id: string;
  icon: string;
  tone: ToastTone;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface PriceAlert {
  id: string;
  pair: string;
  condition: string;
  price: number;
  note?: string;
}

export interface AppUser {
  id?: string;
  name: string;
  handle: string;
  email?: string;
  loc?: string;
  joinedAt?: string;
  role: "student" | "instructor";
  plan: "free" | "pro" | "funded";
  level: number;
  streak: number;
  avatarSeed?: number;
  riskPct: number;
  instruments: string[];
  experience: "beginner" | "intermediate" | "advanced";
  framework: string;
}

export interface Toast {
  id: string;
  msg: string;
  tone: ToastTone;
  icon: string;
}



// ─── Store ────────────────────────────────────────────────────────────────────

interface AppStore {
  feed: FeedPost[];
  notifs: Notif[];
  priceAlerts: PriceAlert[];
  journaledAlerts: Set<string>;
  likedPosts: Set<string>;
  user: AppUser | null;
  toasts: Toast[];

  // computed
  unreadCount: number;

  // feed
  setFeed: (feed: FeedPost[]) => void;
  addPost: (post: Omit<FeedPost, "id" | "likes" | "comments" | "commentList">) => void;
  toggleLike: (id: string) => void;
  addComment: (id: string, text: string) => void;

  // alerts
  addJournaledAlert: (id: string) => void;

  // price alerts
  addPriceAlert: (pa: Omit<PriceAlert, "id">) => string;
  removePriceAlert: (id: string) => void;

  // notifs
  setNotifs: (notifs: Notif[]) => void;
  markNotifsRead: () => void;

  // user
  setUser: (user: AppUser) => void;

  // toasts
  toast: (msg: string, tone?: ToastTone, icon?: string) => void;

  // mobile nav
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
}



function loadJournaledAlerts(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("smfx_journaled");
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(); }
}

export const useStore = create<AppStore>((set, get) => ({
  feed: [],
  notifs: [],
  priceAlerts: [],
  journaledAlerts: loadJournaledAlerts(),
  likedPosts: new Set(),
  user: null,
  toasts: [],
  unreadCount: 0,

  setFeed: (feed) => set({ feed }),

  addPost: (post) =>
    set((s) => ({
      feed: [{ id: "f" + Date.now(), likes: 0, comments: 0, commentList: [], ...post }, ...s.feed],
    })),

  toggleLike: (id) =>
    set((s) => {
      const liked = new Set(s.likedPosts);
      const delta = liked.has(id) ? -1 : 1;
      liked.has(id) ? liked.delete(id) : liked.add(id);
      return {
        likedPosts: liked,
        feed: s.feed.map((f) => (f.id === id ? { ...f, likes: f.likes + delta } : f)),
      };
    }),

  addComment: (id, text) =>
    set((s) => ({
      feed: s.feed.map((f) =>
        f.id === id
          ? { ...f, comments: f.comments + 1, commentList: [...f.commentList, { name: "You", text, time: "now" }] }
          : f
      ),
    })),

  addJournaledAlert: (id) =>
    set((s) => {
      const next = new Set(s.journaledAlerts).add(id);
      try { localStorage.setItem("smfx_journaled", JSON.stringify([...next])); } catch { /* ignore */ }
      return { journaledAlerts: next };
    }),

  addPriceAlert: (pa) => {
    const id = "pa" + Date.now();
    set((s) => ({ priceAlerts: [{ id, ...pa }, ...s.priceAlerts] }));
    get().toast(`Alert set on ${pa.pair} @ ${pa.price}`, "gold", "notifications_active");
    return id;
  },

  removePriceAlert: (id) =>
    set((s) => ({ priceAlerts: s.priceAlerts.filter((p) => p.id !== id) })),

  setNotifs: (notifs) => set({ notifs, unreadCount: notifs.filter((n) => n.unread).length }),

  markNotifsRead: () =>
    set((s) => ({
      notifs: s.notifs.map((n) => ({ ...n, unread: false })),
      unreadCount: 0,
    })),

  setUser: (user) => set({ user }),

  mobileSidebarOpen: false,
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),

  toast: (msg, tone = "teal", icon = "check_circle") => {
    const id = "to" + Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, msg, tone, icon }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
}));
