# Conversion Rules

## Pipeline
1. Normalize whitespace.
2. Classify each character.
3. Find the longest dictionary phrase match.
4. Fall back to word match.
5. Fall back to character lookup.
6. Mark unmatched Cantonese text unresolved.
7. Format selected readings as space-separated Jyutping syllables.

## Match priority
1. User override
2. Exact phrase match
3. Longest phrase match
4. Word match
5. Character fallback
6. Unresolved

## Ambiguity
- If a segment has multiple dictionary readings, select the default.
- Display all relevant alternatives.
- Never silently discard competing readings.

## Non-Cantonese text
- Latin letters, digits, punctuation, and unsupported scripts pass through unchanged.
- Mark them as `passthrough`.

## Output
- Use tone numbers 1–6.
- Separate Jyutping syllables with spaces.
- Preserve non-Cantonese characters in their original form.