import type { DictionaryEntry, Reading } from "../../../src/cantonese/types.js";

function reading(id: string, jyutping: string, sourceEntryId: string, priority: number | null = null, isDefault = false): Reading {
  return {
    id,
    jyutping,
    syllables: jyutping.trim().split(/\s+/u).map((text) => ({
      text: text.slice(0, -1),
      tone: Number(text.slice(-1)) as 1 | 2 | 3 | 4 | 5 | 6
    })),
    source: "dictionary",
    provenance: [{
      sourceEntryId,
      sourceName: "rime-cantonese",
      sourceVersion: "fixture",
      priority
    }],
    priority,
    isDefault
  };
}

function entry(
  id: string,
  sourceEntryId: string,
  entryType: "character" | "word" | "phrase",
  originalText: string,
  readings: Reading[],
  priority: number | null = null,
  traditionalText: string | null = originalText,
  simplifiedText: string | null = null
): DictionaryEntry {
  return {
    id,
    source: "rime-cantonese",
    sourceEntryId,
    sourceVersion: "fixture",
    entryType,
    originalText,
    traditionalText,
    simplifiedText,
    readings,
    priority
  };
}

export const fixtureDictionary: DictionaryEntry[] = [
  entry("char-中", "c001", "character", "中", [reading("r-中-zung1", "zung1", "c001", null, true)]),
  entry("char-中-duplicate", "c001", "character", "中", [reading("r-中-zung1-duplicate", "zung1", "c001", null, true)]),
  entry("char-文", "c002", "character", "文", [reading("r-文-man4", "man4", "c002")]),
  entry("char-英", "c003", "character", "英", [reading("r-英-jing1", "jing1", "c003")]),
  entry("char-語", "c004", "character", "語", [reading("r-語-jyu5", "jyu5", "c004")]),
  entry("char-我", "c005", "character", "我", [reading("r-我-ngo5", "ngo5", "c005")]),
  entry("char-你", "c006", "character", "你", [reading("r-你-nei5", "nei5", "c006")]),
  entry("char-好", "c007", "character", "好", [reading("r-好-hou2", "hou2", "c007")]),
  entry("char-香", "c008", "character", "香", [reading("r-香-hoeng1", "hoeng1", "c008")]),
  entry("char-港", "c009", "character", "港", [reading("r-港-gong2", "gong2", "c009")]),
  entry("char-行", "c010", "character", "行", [
    reading("r-行-hang4", "hang4", "c010", 100, true),
    reading("r-行-haang6", "haang6", "c010", 80)
  ]),
  entry("word-中文", "w001", "word", "中文", [reading("r-中文", "zung1 man4", "w001")]),
  entry("word-廣東", "w002", "word", "廣東", [reading("r-廣東", "gwong2 dung1", "w002")]),
  entry("word-香港", "w003", "word", "香港", [reading("r-香港", "hoeng1 gong2", "w003")]),
  entry("word-你好", "w004", "word", "你好", [reading("r-你好", "nei5 hou2", "w004")]),
  entry("word-英文", "w005", "word", "英文", [reading("r-英文", "jing1 man4", "w005")]),
  entry("word-電影", "w006", "word", "電影", [reading("r-電影", "din6 jing2", "w006")]),
  entry("word-歌曲", "w007", "word", "歌曲", [reading("r-歌曲", "go1 kuk1", "w007")]),
  entry("word-開心", "w008", "word", "開心", [reading("r-開心", "hoi1 sam1", "w008")]),
  entry("word-多謝", "w009", "word", "多謝", [reading("r-多謝", "do1 ze6", "w009")]),
  entry("word-一首歌", "w010", "word", "一首歌", [reading("r-一首歌", "jat1 sau2 go1", "w010")]),
  entry("phrase-香港電影", "p001", "phrase", "香港電影", [reading("r-香港電影", "hoeng1 gong2 din6 jing2", "p001")]),
  entry("phrase-中文歌", "p002", "phrase", "中文歌", [reading("r-中文歌", "zung1 man4 go1", "p002")]),
  entry("phrase-廣東話", "p003", "phrase", "廣東話", [reading("r-廣東話", "gwong2 dung1 waa2", "p003")]),
  entry("phrase-中英文本", "p004", "phrase", "中英文本", [reading("r-中英文本", "zung1 jing1 man4 bun2", "p004")]),
  entry("phrase-我係歌手", "p005", "phrase", "我係歌手", [reading("r-我係歌手", "ngo5 hai6 go1 sau2", "p005")]),
  entry("word-同一閱讀-a", "w011", "word", "香港", [reading("r-香港-a", "hoeng1 gong2", "w011", 90)], 90),
  entry("word-同一閱讀-b", "w012", "word", "香港", [reading("r-香港-b", "hoeng1 gong2", "w012", 90)], 90),
  entry("phrase-簡繁", "p006", "phrase", "繁體", [reading("r-繁體", "faan4 tai2", "p006")], null, "繁體", "繁体"),
  entry("char-重", "c011", "character", "重", [
    reading("r-重-zung6", "zung6", "c011", 100, true),
    reading("r-重-cung4", "cung4", "c011", 80)
  ]),
  entry("char-教", "c012", "character", "教", [
    reading("r-教-gaau3", "gaau3", "c012", 100, true),
    reading("r-教-jiu3", "jiu3", "c012", 80)
  ]),
  entry("char-重-zung6-conflict", "c013", "character", "重", [reading("r-重-zung6-conflict", "zung6", "c013", null, true)]),
  entry("char-重-cung4-conflict", "c014", "character", "重", [reading("r-重-cung4-conflict", "cung4", "c014", null)]),
  {
    id: "invalid-entry",
    source: "rime-cantonese",
    sourceEntryId: "",
    sourceVersion: "fixture",
    entryType: "character",
    originalText: "",
    traditionalText: null,
    simplifiedText: null,
    readings: [],
    priority: null
  }
];

export const validFixtureDictionary = fixtureDictionary.filter((entry) =>
  entry.sourceEntryId.length > 0
  && entry.originalText.length > 0
  && entry.readings.length > 0
);
