export interface CountryDialCode {
  name: string;
  iso2: string;
  dialCode: string;
}

// Priority countries surface first in the picker — Smile FX's primary market.
const PRIORITY_ISO2 = ["ZM", "ZA", "NG", "KE", "GH", "ZW", "TZ", "UG"];

const ALL_COUNTRIES: CountryDialCode[] = [
  { name: "Zambia", iso2: "ZM", dialCode: "260" },
  { name: "South Africa", iso2: "ZA", dialCode: "27" },
  { name: "Nigeria", iso2: "NG", dialCode: "234" },
  { name: "Kenya", iso2: "KE", dialCode: "254" },
  { name: "Ghana", iso2: "GH", dialCode: "233" },
  { name: "Zimbabwe", iso2: "ZW", dialCode: "263" },
  { name: "Tanzania", iso2: "TZ", dialCode: "255" },
  { name: "Uganda", iso2: "UG", dialCode: "256" },
  { name: "Algeria", iso2: "DZ", dialCode: "213" },
  { name: "Angola", iso2: "AO", dialCode: "244" },
  { name: "Benin", iso2: "BJ", dialCode: "229" },
  { name: "Botswana", iso2: "BW", dialCode: "267" },
  { name: "Burkina Faso", iso2: "BF", dialCode: "226" },
  { name: "Burundi", iso2: "BI", dialCode: "257" },
  { name: "Cameroon", iso2: "CM", dialCode: "237" },
  { name: "Cape Verde", iso2: "CV", dialCode: "238" },
  { name: "Central African Republic", iso2: "CF", dialCode: "236" },
  { name: "Chad", iso2: "TD", dialCode: "235" },
  { name: "Comoros", iso2: "KM", dialCode: "269" },
  { name: "Congo (DRC)", iso2: "CD", dialCode: "243" },
  { name: "Congo (Republic)", iso2: "CG", dialCode: "242" },
  { name: "Djibouti", iso2: "DJ", dialCode: "253" },
  { name: "Egypt", iso2: "EG", dialCode: "20" },
  { name: "Equatorial Guinea", iso2: "GQ", dialCode: "240" },
  { name: "Eritrea", iso2: "ER", dialCode: "291" },
  { name: "Eswatini", iso2: "SZ", dialCode: "268" },
  { name: "Ethiopia", iso2: "ET", dialCode: "251" },
  { name: "Gabon", iso2: "GA", dialCode: "241" },
  { name: "Gambia", iso2: "GM", dialCode: "220" },
  { name: "Guinea", iso2: "GN", dialCode: "224" },
  { name: "Guinea-Bissau", iso2: "GW", dialCode: "245" },
  { name: "Ivory Coast", iso2: "CI", dialCode: "225" },
  { name: "Lesotho", iso2: "LS", dialCode: "266" },
  { name: "Liberia", iso2: "LR", dialCode: "231" },
  { name: "Libya", iso2: "LY", dialCode: "218" },
  { name: "Madagascar", iso2: "MG", dialCode: "261" },
  { name: "Malawi", iso2: "MW", dialCode: "265" },
  { name: "Mali", iso2: "ML", dialCode: "223" },
  { name: "Mauritania", iso2: "MR", dialCode: "222" },
  { name: "Mauritius", iso2: "MU", dialCode: "230" },
  { name: "Morocco", iso2: "MA", dialCode: "212" },
  { name: "Mozambique", iso2: "MZ", dialCode: "258" },
  { name: "Namibia", iso2: "NA", dialCode: "264" },
  { name: "Niger", iso2: "NE", dialCode: "227" },
  { name: "Rwanda", iso2: "RW", dialCode: "250" },
  { name: "Senegal", iso2: "SN", dialCode: "221" },
  { name: "Sierra Leone", iso2: "SL", dialCode: "232" },
  { name: "Somalia", iso2: "SO", dialCode: "252" },
  { name: "South Sudan", iso2: "SS", dialCode: "211" },
  { name: "Sudan", iso2: "SD", dialCode: "249" },
  { name: "Togo", iso2: "TG", dialCode: "228" },
  { name: "Tunisia", iso2: "TN", dialCode: "216" },
  { name: "United States", iso2: "US", dialCode: "1" },
  { name: "Canada", iso2: "CA", dialCode: "1" },
  { name: "United Kingdom", iso2: "GB", dialCode: "44" },
  { name: "Ireland", iso2: "IE", dialCode: "353" },
  { name: "Australia", iso2: "AU", dialCode: "61" },
  { name: "New Zealand", iso2: "NZ", dialCode: "64" },
  { name: "India", iso2: "IN", dialCode: "91" },
  { name: "Pakistan", iso2: "PK", dialCode: "92" },
  { name: "Bangladesh", iso2: "BD", dialCode: "880" },
  { name: "United Arab Emirates", iso2: "AE", dialCode: "971" },
  { name: "Saudi Arabia", iso2: "SA", dialCode: "966" },
  { name: "Qatar", iso2: "QA", dialCode: "974" },
  { name: "Israel", iso2: "IL", dialCode: "972" },
  { name: "Turkey", iso2: "TR", dialCode: "90" },
  { name: "Germany", iso2: "DE", dialCode: "49" },
  { name: "France", iso2: "FR", dialCode: "33" },
  { name: "Spain", iso2: "ES", dialCode: "34" },
  { name: "Portugal", iso2: "PT", dialCode: "351" },
  { name: "Italy", iso2: "IT", dialCode: "39" },
  { name: "Netherlands", iso2: "NL", dialCode: "31" },
  { name: "Belgium", iso2: "BE", dialCode: "32" },
  { name: "Switzerland", iso2: "CH", dialCode: "41" },
  { name: "Sweden", iso2: "SE", dialCode: "46" },
  { name: "Norway", iso2: "NO", dialCode: "47" },
  { name: "Denmark", iso2: "DK", dialCode: "45" },
  { name: "Poland", iso2: "PL", dialCode: "48" },
  { name: "Greece", iso2: "GR", dialCode: "30" },
  { name: "Russia", iso2: "RU", dialCode: "7" },
  { name: "China", iso2: "CN", dialCode: "86" },
  { name: "Japan", iso2: "JP", dialCode: "81" },
  { name: "South Korea", iso2: "KR", dialCode: "82" },
  { name: "Singapore", iso2: "SG", dialCode: "65" },
  { name: "Malaysia", iso2: "MY", dialCode: "60" },
  { name: "Indonesia", iso2: "ID", dialCode: "62" },
  { name: "Philippines", iso2: "PH", dialCode: "63" },
  { name: "Thailand", iso2: "TH", dialCode: "66" },
  { name: "Vietnam", iso2: "VN", dialCode: "84" },
  { name: "Brazil", iso2: "BR", dialCode: "55" },
  { name: "Mexico", iso2: "MX", dialCode: "52" },
  { name: "Argentina", iso2: "AR", dialCode: "54" },
  { name: "Colombia", iso2: "CO", dialCode: "57" },
  { name: "Chile", iso2: "CL", dialCode: "56" },
];

export const COUNTRIES: CountryDialCode[] = [
  ...PRIORITY_ISO2.map((iso2) => ALL_COUNTRIES.find((c) => c.iso2 === iso2)!),
  ...ALL_COUNTRIES.filter((c) => !PRIORITY_ISO2.includes(c.iso2)).sort((a, b) => a.name.localeCompare(b.name)),
];

export const DEFAULT_COUNTRY_ISO2 = "ZM";

export function findCountryByIso2(iso2: string): CountryDialCode {
  return COUNTRIES.find((c) => c.iso2 === iso2) ?? COUNTRIES[0];
}

/** Strips any leading 0, +, spaces, or the dial code itself off a raw national-number string. */
export function toNationalNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "").replace(/^0+/, "");
}

/** Combines a country's dial code with a local/national number into E.164 format. */
export function toE164(dialCode: string, national: string): string {
  return `+${dialCode}${toNationalNumber(national)}`;
}
