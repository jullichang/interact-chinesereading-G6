import React, { useState, useEffect } from 'react';
import { Article, SegmentedWord, AppMode } from '../types';
import { Volume2, VolumeX, Eye, EyeOff, Play, Square, FastForward, Sparkles, BookOpen, ChevronRight, Info } from 'lucide-react';
import { ttsService } from '../services/tts';

interface StudentReaderProps {
  article: Article;
  mode: AppMode;
  onSelectWord: (word: SegmentedWord) => void;
  onOpenArticleList: () => void;
}

export const StudentReader: React.FC<StudentReaderProps> = ({
  article,
  mode,
  onSelectWord,
  onOpenArticleList,
}) => {
  const [hidePinyin, setHidePinyin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');

  // Stop TTS when unmounting or switching articles
  useEffect(() => {
    return () => {
      ttsService.stop();
      setIsPlaying(false);
      setActiveWordIndex(null);
    };
  }, [article.id]);

  // Read full text aloud
  const handleReadFullText = () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
      setActiveWordIndex(null);
      return;
    }

    setIsPlaying(true);
    setActiveWordIndex(0);

    // Filter non-punctuation words for speech tracking
    const textToSpeak = article.content;

    // Use boundary listener to highlight current word
    let wordCharOffsetCounter = 0;
    const wordOffsets = article.words.map((w) => {
      const start = wordCharOffsetCounter;
      wordCharOffsetCounter += w.text.length;
      return { start, end: wordCharOffsetCounter, word: w };
    });

    ttsService.speak(textToSpeak, {
      rate: speechRate,
      onBoundary: (charIndex) => {
        const found = wordOffsets.findIndex(
          (o) => charIndex >= o.start && charIndex < o.end
        );
        if (found !== -1) {
          setActiveWordIndex(found);
        }
      },
      onEnd: () => {
        setIsPlaying(false);
        setActiveWordIndex(null);
      },
      onError: () => {
        setIsPlaying(false);
        setActiveWordIndex(null);
      },
    });
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'normal':
        return 'text-2xl sm:text-3xl leading-loose';
      case 'large':
        return 'text-3xl sm:text-4xl leading-[2.5]';
      case 'xlarge':
        return 'text-4xl sm:text-5xl leading-[2.8]';
    }
  };

  const getPinyinSizeClass = () => {
    switch (fontSize) {
      case 'normal':
        return 'text-xs sm:text-sm font-mono';
      case 'large':
        return 'text-sm sm:text-base font-mono';
      case 'xlarge':
        return 'text-base sm:text-lg font-mono';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Article Meta Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {article.level}
              </span>
              <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                {article.category}
              </span>
              {article.author && (
                <span className="text-xs text-stone-400">作者：{article.author}</span>
              )}
            </div>

            <button
              onClick={onOpenArticleList}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>切換其他文章</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {!hidePinyin && article.titlePinyin && (
              <div className="text-sm sm:text-base font-mono font-medium text-emerald-600 tracking-wider">
                {article.titlePinyin}
              </div>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 font-serif tracking-tight">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Global Controls: Hide/Show Pinyin, Read Full Text, Font Size */}
        <div className="bg-stone-900 rounded-2xl p-4 text-stone-100 shadow-md flex flex-wrap items-center justify-between gap-4">
          {/* Main Requested Buttons: Hide/Show Pinyin & Read Full Text */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Toggle Pinyin Button (隱藏拼音 / 顯示拼音) */}
            <button
              onClick={() => setHidePinyin(!hidePinyin)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                hidePinyin
                  ? 'bg-amber-600 text-white hover:bg-amber-500 ring-2 ring-amber-400/40'
                  : 'bg-emerald-700 text-white hover:bg-emerald-600'
              }`}
            >
              {hidePinyin ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>顯示拼音</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>隱藏拼音</span>
                </>
              )}
            </button>

            {/* 2. Read Full Text Button (朗讀全文) */}
            <button
              onClick={handleReadFullText}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md transform active:scale-95 ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400 animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>停止朗讀</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>朗讀全文</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Controls: Speed & Font Size */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Speed Selector */}
            <div className="flex items-center gap-1.5 bg-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-700">
              <span className="text-stone-400 font-medium">語速:</span>
              {[0.75, 0.9, 1.1].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    speechRate === rate
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {rate === 0.75 ? '慢速' : rate === 0.9 ? '標準' : '快速'}
                </button>
              ))}
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-1.5 bg-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-700">
              <span className="text-stone-400 font-medium">字體:</span>
              {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    fontSize === sz
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {sz === 'normal' ? '中' : sz === 'large' ? '大' : '特大'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Text Display Canvas */}
        <div className="bg-white rounded-3xl p-6 sm:p-12 border border-stone-200 shadow-xl min-h-[350px]">
          {/* Reader Hint Banner */}
          <div className="mb-6 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>點選下方任何詞語，即可跳轉至專屬「詞語解釋、發音與造句」頁面。</span>
            </div>
            <span className="font-mono text-emerald-700 font-semibold hidden sm:inline">
              {hidePinyin ? '拼音模式: 已隱藏' : '拼音模式: 顯示中'}
            </span>
          </div>

          {/* Render Segmented Text */}
          <div className="flex flex-wrap items-end gap-y-6 gap-x-1.5 sm:gap-x-2 font-serif select-none">
            {article.words.map((word, idx) => {
              if (word.isPunctuation) {
                return (
                  <span
                    key={word.id || idx}
                    className={`${getFontSizeClass()} text-stone-800 font-sans mx-0.5`}
                  >
                    {word.text}
                  </span>
                );
              }

              const isActiveReading = activeWordIndex === idx;

              return (
                <button
                  key={word.id || idx}
                  onClick={() => onSelectWord(word)}
                  className={`group relative inline-flex flex-col items-center justify-end px-1.5 py-1 rounded-xl transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95 ${
                    isActiveReading
                      ? 'bg-amber-300 text-amber-950 ring-4 ring-amber-400 shadow-md font-bold scale-105 z-10'
                      : 'hover:bg-emerald-100/80 hover:text-emerald-900 text-stone-900'
                  }`}
                  title={`點選查看「${word.text}」的發音與解釋`}
                >
                  {/* Pinyin annotation (Stacked above text) */}
                  <span
                    className={`${getPinyinSizeClass()} text-emerald-700 group-hover:text-emerald-900 font-semibold mb-0.5 transition-opacity duration-200 ${
                      hidePinyin ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    {word.pinyin || ' '}
                  </span>

                  {/* Character(s) */}
                  <span className={`${getFontSizeClass()} font-bold tracking-wide`}>
                    {word.text}
                  </span>

                  {/* Subtle underline indicator on hover */}
                  <span className="absolute bottom-0.5 left-2 right-2 h-0.5 bg-emerald-500 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Highlights Footer Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              音
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">標準聲調拼音</div>
              <div className="text-xs text-stone-500">聲調符號標註，支援自由隱藏</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              譯
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">詞語雙語釋義</div>
              <div className="text-xs text-stone-500">中文解釋與英文對照</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              句
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">造句與語音朗讀</div>
              <div className="text-xs text-stone-500">例句配音，強化語感</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
