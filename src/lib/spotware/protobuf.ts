// Minimal protobuf wire-format codec for the small, fixed set of cTrader
// Open API messages this integration needs — not a general-purpose protobuf
// library. Field numbers/types come from Spotware's public schema
// (github.com/spotware/openapi-proto-messages). Varint math uses
// multiplication/division instead of bitwise shifts so values above 32 bits
// (e.g. millisecond timestamps) decode correctly within JS's safe-integer
// range.

const WIRE_VARINT = 0;
const WIRE_LEN = 2;

export class ProtoWriter {
  private bytes: number[] = [];

  private tag(fieldNo: number, wireType: number) {
    this.varint((fieldNo << 3) | wireType);
  }

  private varint(n: number) {
    while (n > 0x7f) {
      this.bytes.push((n & 0x7f) | 0x80);
      n = Math.floor(n / 128);
    }
    this.bytes.push(n & 0x7f);
  }

  uint32(fieldNo: number, value: number) {
    this.tag(fieldNo, WIRE_VARINT);
    this.varint(value);
    return this;
  }

  int64(fieldNo: number, value: number) {
    return this.uint32(fieldNo, value);
  }

  bool(fieldNo: number, value: boolean) {
    return this.uint32(fieldNo, value ? 1 : 0);
  }

  string(fieldNo: number, value: string) {
    const enc = new TextEncoder().encode(value);
    this.tag(fieldNo, WIRE_LEN);
    this.varint(enc.length);
    this.bytes.push(...enc);
    return this;
  }

  bytes_(fieldNo: number, value: Uint8Array) {
    this.tag(fieldNo, WIRE_LEN);
    this.varint(value.length);
    this.bytes.push(...value);
    return this;
  }

  finish(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

export interface ProtoField {
  fieldNo: number;
  wireType: number;
  value: number | Uint8Array;
}

export function readFields(buf: Uint8Array): ProtoField[] {
  const fields: ProtoField[] = [];
  let i = 0;

  function readVarint(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = buf[i++];
      result += (byte & 0x7f) * Math.pow(2, shift);
      shift += 7;
    } while (byte & 0x80);
    return result;
  }

  while (i < buf.length) {
    const key = readVarint();
    const fieldNo = Math.floor(key / 8);
    const wireType = key % 8;
    if (wireType === WIRE_VARINT) {
      fields.push({ fieldNo, wireType, value: readVarint() });
    } else if (wireType === WIRE_LEN) {
      const len = readVarint();
      fields.push({ fieldNo, wireType, value: buf.slice(i, i + len) });
      i += len;
    } else if (wireType === 1) {
      i += 8; // fixed64 — unused by our messages
    } else if (wireType === 5) {
      i += 4; // fixed32 — unused by our messages
    } else {
      break; // unknown wire type — stop rather than misparse the rest
    }
  }
  return fields;
}

export function field(fields: ProtoField[], fieldNo: number): ProtoField | undefined {
  return fields.find((f) => f.fieldNo === fieldNo);
}

export function fieldAll(fields: ProtoField[], fieldNo: number): ProtoField[] {
  return fields.filter((f) => f.fieldNo === fieldNo);
}

export function asString(f: ProtoField | undefined): string | undefined {
  if (!f || !(f.value instanceof Uint8Array)) return undefined;
  return new TextDecoder().decode(f.value);
}

export function asNumber(f: ProtoField | undefined): number | undefined {
  if (!f || typeof f.value !== "number") return undefined;
  return f.value;
}

export function asBytes(f: ProtoField | undefined): Uint8Array | undefined {
  if (!f || !(f.value instanceof Uint8Array)) return undefined;
  return f.value;
}
