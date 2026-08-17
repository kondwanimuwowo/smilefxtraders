import { RulebookView } from "@/components/rulebook/RulebookView";

export const metadata = { title: "The Rulebook | Smile FX Traders" };

// Available to every signed-in member, Starter included. Grading someone
// against a standard while hiding the standard from them is indefensible, and
// this is the clearest argument the platform has for what it teaches.
export default function RulebookPage() {
  return (
    <div className="view">
      <div className="mb-6">
        <h1 className="font-display font-medium text-[26px] tracking-[-0.025em] text-ink-strong">
          The Rulebook
        </h1>
        <p className="text-[13px] mt-1 max-w-2xl text-ink-dim">
          The standard every setup is measured against, by the Validator before you enter and by
          Gavo after you journal it. Nothing here is hidden from you.
        </p>
      </div>

      <RulebookView />
    </div>
  );
}
