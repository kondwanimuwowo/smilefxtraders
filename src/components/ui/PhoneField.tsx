"use client";

import { Select } from "./Form";
import { COUNTRIES, findCountryByIso2 } from "@/lib/countries";

interface PhoneFieldProps {
  countryIso2: string;
  onCountryChange: (iso2: string) => void;
  national: string;
  onNationalChange: (national: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}

/**
 * Country selector + local-number input. The caller owns the country/national
 * state and is responsible for combining them into E.164 (see `toE164` in
 * `@/lib/countries`) before sending to the backend — the user never has to
 * type a country code themselves.
 */
export function PhoneField({ countryIso2, onCountryChange, national, onNationalChange, invalid, autoFocus }: PhoneFieldProps) {
  const country = findCountryByIso2(countryIso2);

  return (
    <div className="flex gap-2">
      <div className="w-[168px] shrink-0">
        <Select
          value={countryIso2}
          onChange={onCountryChange}
          options={COUNTRIES.map((c) => ({ v: c.iso2, l: `${c.name} (+${c.dialCode})` }))}
        />
      </div>
      <div className="flex-1 flex items-center rounded-[9px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus-within:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] transition-shadow bg-panel-2">
        <span className="pl-3 text-base sm:text-[13.5px] text-ink-dim select-none">
          +{country.dialCode}
        </span>
        <input
          type="tel"
          inputMode="tel"
          autoFocus={autoFocus}
          value={national}
          onChange={(e) => onNationalChange(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="971234567"
          className={`w-full rounded-[9px] pl-1.5 pr-3 py-2.5 text-base sm:text-[13.5px] outline-none bg-transparent placeholder:text-[var(--ink-dim)] ${
            invalid ? "text-coral" : "text-ink-strong"
          }`}
        />
      </div>
    </div>
  );
}
