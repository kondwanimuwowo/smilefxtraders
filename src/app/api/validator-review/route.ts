import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, getAuthState } from "@/lib/supabase/server";
import { AuthUnavailableError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { buildRulebookPrompt, buildRuleIndexPrompt } from "@/lib/rulebook";
import type { Framework } from "@/lib/frameworks";
import { normaliseSetupRead } from "@/lib/gavo/setup-read";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Pre-trade read, as opposed to the post-trade grade in /api/review.
//
// The instruction not to grade is load-bearing rather than stylistic. The
// Validator has already ruled on this setup deterministically, in its own
// vocabulary (cleared / caution / do-not-take). A second verdict from Gavo on
// the same screen would either agree, adding nothing, or disagree, leaving the
// trader with two answers and no way to choose. So Gavo is told to take the
// verdict as settled and spend its output on what a checklist cannot do:
// weigh several breaks against each other and say which one actually decides
// the trade.
function systemPrompt(framework: Framework): string {
  const label = framework === "SnD" ? "Supply & Demand" : "Smart Money Concepts (ICT)";
  return `You are Gavo, an AI trading coach for the Smile FX Traders community, specialising in ${label}.

A trader is looking at a setup they have NOT taken yet. The Validator has already checked it against the rulebook mechanically and shown them the result. Your job is not to repeat that check or to overrule it.

## What you are for
- The checklist can say three rules are unmet. It cannot say which one actually decides this trade. That judgement is your job
- Say what the combination means. Two cautions that compound are worse than three that do not touch each other
- When the setup is sound, say so plainly and briefly. Do not manufacture concerns to seem useful
- Point at what to watch next: the level that invalidates the idea, the thing that would turn a caution into a break

## What you must not do
- Do NOT grade this setup. No letters, no scores, no "this is a B setup". The Validator owns the verdict and you would be contradicting it
- Do NOT tell the trader to take or skip the trade in those words. Give them the read; the decision and the rulebook verdict are theirs
- Do NOT restate rules that already passed. They can see the checklist
- NEVER cite a rule by number. The trader cannot see numbers in your text. Name the thing in plain words and put the id in the "rules" array instead

## Voice
- Direct and concrete, a coach talking to a student
- Plain punctuation. Never use em dashes; use commas, colons or separate sentences
- Avoid "it's not just X, it's Y" constructions, forced groups of three, staccato fragment chains, and aphorisms about discipline. Say the concrete thing plainly

## The Smile FX Traders ${framework} Rulebook

${buildRulebookPrompt(framework)}

## Rule ids, for citation

${buildRuleIndexPrompt(framework)}

## Response format
Respond ONLY with minified JSON, no markdown fences, no extra text. Shape:
{"read":"one short paragraph, at most 60 words, on what this setup actually is and which break decides it","watch":["a concrete thing to watch, at most 15 words"],"rules":["rule-id"]}

Give 1 to 3 items in "watch". Put every rule id your read leans on in "rules".`;
}

interface SetupPayload {
  framework?: string;
  pair?: string;
  dir?: string;
  model?: string;
  session?: string;
  readiness?: string;
  clear?: number;
  total?: number;
  rules?: Array<{ id?: string; label?: string; status?: string; why?: string }>;
}

/**
 * The setup as the Validator currently sees it.
 *
 * Sent from the client rather than recomputed here on purpose: this is a
 * pre-trade setup, so it exists only in the form's state and there is nothing
 * persisted to load. Nothing is written as a result of this call, so an
 * inaccurate payload costs the trader a poor read of their own setup and
 * nothing else.
 */
function buildMessage(b: SetupPayload): string {
  const lines = [
    `Pair: ${b.pair ?? "?"}`,
    `Direction: ${b.dir ?? "?"}`,
    `Model: ${b.model ?? "?"}`,
    `Session: ${b.session ?? "?"}`,
    `Validator verdict: ${b.readiness ?? "?"} (${b.clear ?? "?"} of ${b.total ?? "?"} applicable rules met)`,
    "",
    "Rule outcomes:",
  ];
  for (const r of b.rules ?? []) {
    if (!r?.id || !r?.status) continue;
    // "na" rules are optional confluence the trader did not claim. They are not
    // failures and must not be read as ones.
    if (r.status === "na") continue;
    lines.push(`- [${r.status}] ${r.id}: ${r.label ?? ""}${r.why ? ` (${r.why})` : ""}`);
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthState(supabase);
    if (auth.state === "unknown") throw new AuthUnavailableError();
    if (auth.state === "anonymous") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user
      .findUnique({ where: { supabaseId: auth.user.id }, select: { plan: true } })
      .catch(() => null);
    if (dbUser?.plan === "FREE") {
      return NextResponse.json(
        { error: "Gavo's pre-trade read requires an Edge or Pro plan.", upgrade: true },
        { status: 403 },
      );
    }

    const body = (await req.json()) as SetupPayload;
    const framework: Framework = body.framework === "SnD" ? "SnD" : "SMC";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: [{
        type: "text",
        text: systemPrompt(framework),
        // Identical for every setup in this framework, so it caches. Note this
        // is a DIFFERENT prefix from /api/review's prompt and caches separately.
        cache_control: { type: "ephemeral" },
      }],
      messages: [{ role: "user", content: buildMessage(body) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    const raw = match ? JSON.parse(match[0]) : { read: text };
    return NextResponse.json(normaliseSetupRead(raw, framework));
  } catch (err) {
    console.error("[validator-review]", err);
    return NextResponse.json({ error: "Gavo could not read this setup." }, { status: 500 });
  }
}
