import { twMerge } from "tailwind-merge";

/**
 * Joins class names and resolves Tailwind conflicts, last one winning.
 *
 * This used to be a plain `filter(Boolean).join(" ")`, which meant two classes
 * targeting the same CSS property both survived into the attribute and the
 * browser picked the winner by STYLESHEET order -- Tailwind's own emission
 * order, not the order they were written. A conditional `font-bold` lost to a
 * base `font-medium` that way: the colour on the same element applied, the
 * weight silently did not.
 *
 * With twMerge the later class wins, which is what every call site already
 * assumed. It also makes consumer overrides work: `<Button className="bg-x" />`
 * now beats the component's own background instead of racing it.
 *
 * Measured before switching: of 841 runtime class combinations across the app,
 * eight changed, all of them a `leading-*` being dropped. That is tailwind-merge
 * applying Tailwind v3 semantics, where `text-{size}` also set line-height. In
 * v4 it does not, so those five call sites were reordered to put `leading-*`
 * after `text-[...]`, where it survives. Nothing else in the app changes.
 *
 * The ordering rule that follows from this: never set a property in the base
 * string that a branch also sets. Put it on every branch instead.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
