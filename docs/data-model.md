# Data Model

## DictionaryEntry
- id
- source
- sourceEntryId
- text
- traditionalText
- simplifiedText
- jyutpingSyllables
- toneNumbers
- entryType: character | word | phrase
- priority
- alternatives

## ConversionSegment
- originalText
- segmentType: cantonese | passthrough | unresolved
- startOffset
- endOffset
- selectedReading
- alternatives
- source
- confidence
- userOverride

## SavedTitle
- id
- originalTitle
- createdAt
- updatedAt
- segments
- finalJyutping
- notes

## Example

Input: `海闊天空`

Expected segments:
- `海闊天空` → phrase dictionary match
- Selected Jyutping: `hoi2 fut3 tin1 hung1`
- Source: Rime-Cantonese phrase dictionary
- Confidence: dictionary