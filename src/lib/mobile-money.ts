// Zambian mobile-money network detection.
//
// Networks are identified by the operator digit in the 09x / 07x range:
//   7 → Airtel   (097x, 077x)
//   6 → MTN      (096x, 076x)
//   5 → Zamtel   (095x, 075x)
//
// We normalise any common input format first:
//   "+260 97 712 3456" · "260977123456" · "0977123456" · "977123456"

export type ZmOperator = "airtel" | "mtn" | "zamtel";

export const ZM_OPERATORS: { value: ZmOperator; label: string }[] = [
  { value: "airtel", label: "Airtel Money"   },
  { value: "mtn",    label: "MTN MoMo"        },
  { value: "zamtel", label: "Zamtel Kwacha"   },
];

export const ZM_OPERATOR_LABEL: Record<ZmOperator, string> = {
  airtel: "Airtel Money",
  mtn:    "MTN MoMo",
  zamtel: "Zamtel Kwacha",
};

/** Strip a raw phone input down to its national significant number (9 digits, "9XXXXXXXX"). */
export function normalizeZmPhone(raw: string): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("260")) digits = digits.slice(3); // drop country code
  if (digits.startsWith("0"))   digits = digits.slice(1); // drop trunk zero
  return digits;
}

/**
 * Detect the mobile-money operator from a Zambian phone number.
 * Returns null when the number is too short or the prefix is unrecognised.
 */
export function detectZmOperator(raw: string): ZmOperator | null {
  const nsn = normalizeZmPhone(raw);
  if (nsn.length < 2) return null;

  // After normalising, the number is "9XX…" (mobile) — the second digit is the network.
  const prefix = nsn.slice(0, 2);
  switch (prefix) {
    case "97": case "77": return "airtel";
    case "96": case "76": return "mtn";
    case "95": case "75": return "zamtel";
    default:              return null;
  }
}
