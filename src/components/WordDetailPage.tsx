import React, { useState } from 'react';
import { SegmentedWord, Article, AppMode } from '../types';
import { ArrowLeft, Volume2, Sparkles, BookOpen, Edit3, Save, CheckCircle2, MessageSquare, Globe } from 'lucide-react';
import { ttsService } from '../services/tts';

interface WordDetailPageProps {
  word: SegmentedWord;
  article: Article;
  mode: AppMode;
  onBackToArticle: () => void;
  onUpdateWord?: (updatedWord: SegmentedWord) => void;
}

export const WordDetailPage: React.FC<WordDetailPageProps> = ({
  word,
  article,
  mode,
  onBackToArticle,
  onUpdateWord,
}) => {
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingExample, setIsPlayingExample] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Edit form state
  const [editPinyin, setEditPinyin] = useState(word.pinyin || '');
  const [editExplanation, setEditExplanation] = useState(word.explanation || '');
  const [editEnglish, setEditEnglish] = useState(word.english || '');
  const [editExample, setEditExample] = useState(word.example || '');
  const [editExamplePinyin, setEditExamplePinyin] = useState(word.examplePinyin || '');

  const handlePlayWord = () => {
    setIsPlayingWord(true);
    ttsService.speak(word.text, {
      onEnd: () => setIsPlayingWord(false),
      onError: () => setIsPlayingWord(false),
    });
  };

  const handlePlayExample = () => {
    if (!word.example) return;
    setIsPlayingExample(true);
    ttsService.speak(word.example, {
      onEnd: () => setIsPlayingExample(false),
      onError: () => setIsPlayingExample(false),
    });
  };

  const handleSaveEdit = () => {
    const updated: SegmentedWord = {
      ...word,
      pinyin: editPinyin,
      explanation: editExplanation,
      english: editEnglish,
      example: editExample,
      examplePinyin: editExamplePinyin,
    };
    if (onUpdateWord) {
      onUpdateWord(updated);
    }
    setIsEditing(false);
  };

  const handleAiRefill = async () => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/generate-word-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.text, context: article.content }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        setEditPinyin(data.data.pinyin || editPinyin);
        setEditExplanation(data.data.explanation || editExplanation);
        setEditEnglish(data.data.english || editEnglish);
        setEditExample(data.data.example || editExample);
        setEditExamplePinyin(data.data.examplePinyin || editExamplePinyin);
        setIsEditing(true);
      }
    } catch (e) {
      console.error('Failed to fetch AI word detail:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Navigation & Return Button */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBackToArticle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 font-medium shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-400" />
            <span>返回原文 ({article.title})</span>
          </button>

          <div className="text-xs text-stone-500 font-medium">
            文章來源: <span className="text-stone-800 font-semibold">{article.title}</span>
          </div>
        </div>

        {/* Word Display Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              {/* Pinyin with Tones */}
              <div className="text-xl sm:text-2xl font-mono font-semibold text-emerald-600 mb-1 tracking-wider">
                {word.pinyin || '—'}
              </div>
              {/* Main Word Characters */}
              <h2 className="text-4xl sm:text-6xl font-extrabold text-stone-900 tracking-wide font-serif">
                {word.text}
              </h2>
            </div>

            {/* Audio Button & Teacher Edit Switch */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayWord}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-medium shadow-md transition-all transform active:scale-95 ${
                  isPlayingWord
                    ? 'bg-emerald-600 ring-4 ring-emerald-200 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Volume2 className="w-6 h-6" />
                <span className="text-base">{isPlayingWord ? '朗讀中...' : '詞語發音'}</span>
              </button>

              {mode === 'teacher' && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                  title="編輯詞條"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form for Teachers */}
        {mode === 'teacher' && isEditing && (
          <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>教師權限：修改詞條內容</span>
              </h3>
              <button
                onClick={handleAiRefill}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiLoading ? 'AI 生成中...' : '✨ AI 自動補充細節'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">漢語拼音 (帶聲調)</label>
                <input
                  type="text"
                  value={editPinyin}
                  onChange={(e) => setEditPinyin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm"
                  placeholder="例: tù zi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">英文翻譯</label>
                <input
                  type="text"
                  value={editEnglish}
                  onChange={(e) => setEditEnglish(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm"
                  placeholder="例: rabbit"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">中文解釋</label>
              <textarea
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm h-20"
                placeholder="輸入中文解釋..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">造句例句 (繁體中文)</label>
                <input
                  type="text"
                  value={editExample}
                  onChange={(e) => setEditExample(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm"
                  placeholder="例: 小兔子在樹下吃草。"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">造句拼音</label>
                <input
                  type="text"
                  value={editExamplePinyin}
                  onChange={(e) => setEditExamplePinyin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm"
                  placeholder="例: xiǎo tù zi zài shù xià chī cǎo."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 text-stone-700 text-xs font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>儲存修改</span>
              </button>
            </div>
          </div>
        )}

        {/* Detailed Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chinese Explanation Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold border-b border-stone-100 pb-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>中文解釋</span>
            </div>
            <p className="text-stone-700 text-base leading-relaxed font-sans">
              {word.explanation || '暫無中文解釋。教師可切換至教師模式進行編輯與補充。'}
            </p>
          </div>

          {/* English Translation Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sky-700 font-bold border-b border-stone-100 pb-2">
              <Globe className="w-5 h-5 text-sky-600" />
              <span>英文翻譯 (English)</span>
            </div>
            <p className="text-stone-800 text-lg font-medium font-mono">
              {word.english || 'No English translation available.'}
            </p>
          </div>
        </div>

        {/* Example Sentence Card with Audio */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-lg">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span>例句造句</span>
            </div>

            {word.example && (
              <button
                onClick={handlePlayExample}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isPlayingExample
                    ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingExample ? '造句朗讀中...' : '造句發音'}</span>
              </button>
            )}
          </div>

          {word.example ? (
            <div className="space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
              {word.examplePinyin && (
                <div className="text-sm font-mono text-emerald-700 font-medium">
                  {word.examplePinyin}
                </div>
              )}
              <div className="text-xl font-medium text-stone-900 font-serif leading-relaxed">
                {word.example}
              </div>
            </div>
          ) : (
            <p className="text-stone-500 text-sm italic">
              尚無造句例句。切換為教師模式即可點選「AI 自動補充」生成造句。
            </p>
          )}
        </div>

        {/* Context in Original Article */}
        <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-100 space-y-2">
          <div className="text-xs font-bold text-emerald-900 tracking-wide uppercase">
            文章上下文脈絡
          </div>
          <p className="text-stone-700 text-sm leading-relaxed">
            {article.content}
          </p>
        </div>

        {/* Bottom Return Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={onBackToArticle}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-400" />
            <span>返回原文 ({article.title})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
