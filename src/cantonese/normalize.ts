import type { SegmentType } from "./types.js";

export type CharacterCategory =
  | "cantonese-han"
  | "latin"
  | "digit"
  | "punctuation"
  | "whitespace"
  | "unsupported";

export interface CharacterClassification {
  category: CharacterCategory;
  segmentType: SegmentType;
  startOffset: number;
  endOffset: number;
}

export interface NormalizedTitle {
  originalTitle: string;
  normalizedTitle: string;
  classifications: CharacterClassification[];
}

export function classifyCharacter(character: string, offset = 0): CharacterClassification {
  let category: CharacterCategory;
  let segmentType: SegmentType;

  if (/\p{Script=Han}/u.test(character)) {
    category = "cantonese-han";
    segmentType = "cantonese";
  } else if (/^[A-Za-z]$/u.test(character)) {
    category = "latin";
    segmentType = "passthrough";
  } else if (/^[0-9]$/u.test(character)) {
    category = "digit";
    segmentType = "passthrough";
  } else if (/^\s$/u.test(character)) {
    category = "whitespace";
    segmentType = "passthrough";
  } else if (/^[\p{P}\p{S}]$/u.test(character)) {
    category = "punctuation";
    segmentType = "passthrough";
  } else {
    category = "unsupported";
    segmentType = "unresolved";
  }

  return {
    category,
    segmentType,
    startOffset: offset,
    endOffset: offset + character.length
  };
}

export function normalizeText(input: string): NormalizedTitle {
  const classifications: CharacterClassification[] = [];

  for (let offset = 0; offset < input.length;) {
    const codePoint = input.codePointAt(offset);
    if (codePoint === undefined) break;
    const character = String.fromCodePoint(codePoint);
    classifications.push(classifyCharacter(character, offset));
    offset += character.length;
  }

  return {
    originalTitle: input,
    normalizedTitle: input,
    classifications
  };
}

export function classifyRange(input: string, startOffset: number, endOffset: number): CharacterCategory {
  const text = input.slice(startOffset, endOffset);
  if (!text) return "punctuation";
  return classifyCharacter(text, startOffset).category;
}
