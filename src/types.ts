export interface SegmentedWord {
  id: string;
  text: string;
  pinyin: string;
  explanation?: string;
  english?: string;
  example?: string;
  examplePinyin?: string;
  isPunctuation?: boolean;
}

export interface Article {
  id: string;
  title: string;
  titlePinyin: string;
  level: '初級' | '中級' | '高級';
  category: string;
  content: string;
  words: SegmentedWord[];
  createdAt: string;
  updatedAt: string;
  author?: string;
}

export type AppMode = 'student' | 'teacher';

export interface TTSOptions {
  rate: number;
  pitch: number;
  lang: string;
}
