import React, { useState, useEffect, useRef } from 'react';
import { Article, SegmentedWord } from '../types';
import { Sparkles, Edit3, Trash2, Plus, Save, RotateCcw, Check, ArrowRight, Layers, Split, Merge, AlertCircle } from 'lucide-react';

interface TeacherEditorProps {
  article: Article;
  onSaveArticle: (updatedArticle: Article) => void;
  onDeleteArticle: (articleId: string) => void;
  onSelectWordDetail: (word: SegmentedWord) => void;
}

export const TeacherEditor: React.FC<TeacherEditorProps> = ({
  article,
  onSaveArticle,
  onDeleteArticle,
  onSelectWordDetail,
}) => {
  const [title, setTitle] = useState(article.title);
  const [titlePinyin, setTitlePinyin] = useState(article.titlePinyin);
  const [level, setLevel] = useState(article.level);
  const [category, setCategory] = useState(article.category);
  const [author, setAuthor] = useState(article.author || '');
  const [content, setContent] = useState(article.content);
  const [words, setWords] = useState<SegmentedWord[]>(article.words || []);

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Selected word for inline editing in teacher view
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  const isInitialMount = useRef(true);

  // Sync local state when active article ID changes
  useEffect(() => {
    isInitialMount.current = true;
    setTitle(article.title);
    setTitlePinyin(article.titlePinyin);
    setLevel(article.level);
    setCategory(article.category);
    setAuthor(article.author || '');
    setContent(article.content);
    setWords(article.words || []);
    setSelectedWordIndex(null);
  }, [article.id]);

  // Auto-save changes to parent App & localStorage whenever local fields change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const updatedArticle: Article = {
      ...article,
      title,
      titlePinyin,
      level,
      category,
      author,
      content,
      words,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveArticle(updatedArticle);
  }, [title, titlePinyin, level, category, author, content, words]);

  // Helper to build updated article object
  const getUpdatedArticle = (customWords?: SegmentedWord[], customFields?: Partial<Article>): Article => ({
    ...article,
    title: customFields?.title ?? title,
    titlePinyin: customFields?.titlePinyin ?? titlePinyin,
    level: customFields?.level ?? level,
    category: customFields?.category ?? category,
    author: customFields?.author ?? author,
    content: customFields?.content ?? content,
    words: customWords ?? words,
    updatedAt: new Date().toISOString().split('T')[0],
  });

  // AI Auto-segmentation & dictionary generation handler
  const handleAiAutoAnalyze = async () => {
    if (!content.trim()) {
      alert('請先輸入文章內容！');
      return;
    }

    setIsAiProcessing(true);
    setAiMessage('正在呼叫 Gemini AI 進行華語文自動分詞、聲調拼音標註與字典編撰...');

    try {
      const response = await fetch('/api/analyze-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, title }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        const newTitlePinyin = data.titlePinyin || titlePinyin;
        const newLevel = data.level || level;
        const newCategory = data.category || category;

        if (data.titlePinyin) setTitlePinyin(data.titlePinyin);
        if (data.level) setLevel(data.level);
        if (data.category) setCategory(data.category);

        if (Array.isArray(data.words)) {
          const formattedWords: SegmentedWord[] = data.words.map((w: any, idx: number) => ({
            id: `tw-${Date.now()}-${idx}`,
            text: w.text || '',
            pinyin: w.pinyin || '',
            explanation: w.explanation || '',
            english: w.english || '',
            example: w.example || '',
            examplePinyin: w.examplePinyin || '',
            isPunctuation: w.isPunctuation || false,
          }));
          setWords(formattedWords);

          const updatedArticle = getUpdatedArticle(formattedWords, {
            titlePinyin: newTitlePinyin,
            level: newLevel,
            category: newCategory,
          });
          onSaveArticle(updatedArticle);

          setAiMessage('✨ AI 自動分詞與詞庫生成成功！新資料已自動儲存。');
        }
      } else {
        alert('AI 分析失敗：' + (result.error || '未知錯誤'));
      }
    } catch (e: any) {
      console.error('Error auto analyzing article:', e);
      alert('連線失敗，請檢查網路或 Gemini API 設定。');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Merge selected word with next word
  const handleMergeNext = (index: number) => {
    if (index >= words.length - 1) return;
    const current = words[index];
    const next = words[index + 1];

    const merged: SegmentedWord = {
      id: current.id,
      text: current.text + next.text,
      pinyin: `${current.pinyin} ${next.pinyin}`.trim(),
      explanation: `${current.explanation || ''} ${next.explanation || ''}`.trim(),
      english: `${current.english || ''} ${next.english || ''}`.trim(),
      example: current.example || next.example || '',
      examplePinyin: current.examplePinyin || next.examplePinyin || '',
      isPunctuation: false,
    };

    const updated = [...words];
    updated.splice(index, 2, merged);
    setWords(updated);
  };

  // Split selected word into individual Chinese characters
  const handleSplitWord = (index: number) => {
    const target = words[index];
    if (target.text.length <= 1 || target.isPunctuation) return;

    const chars = target.text.split('');
    const pinyinParts = (target.pinyin || '').split(' ');

    const newTokens: SegmentedWord[] = chars.map((c, i) => ({
      id: `split-${Date.now()}-${i}`,
      text: c,
      pinyin: pinyinParts[i] || '',
      explanation: i === 0 ? target.explanation : '',
      english: i === 0 ? target.english : '',
      example: '',
      examplePinyin: '',
      isPunctuation: false,
    }));

    const updated = [...words];
    updated.splice(index, 1, ...newTokens);
    setWords(updated);
  };

  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // Batch auto-generate pinyin, english, explanation, and example for all segmented words
  const handleBatchGenerateAllDetails = async () => {
    const validWords = words.filter((w) => !w.isPunctuation && w.text.trim());
    if (validWords.length === 0) {
      alert('目前沒有詞語可生成資料。請先輸入原文並點選「✨ 自動生成分詞與詞庫」。');
      return;
    }

    setIsBatchGenerating(true);
    setAiMessage('正在呼叫 Gemini AI 批量補全所有分詞的拼音、英文翻譯、中文解釋與造句...');

    try {
      const updatedWords = [...words];
      for (let i = 0; i < updatedWords.length; i++) {
        const w = updatedWords[i];
        if (w.isPunctuation || !w.text.trim()) continue;

        try {
          const res = await fetch('/api/generate-word-detail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: w.text, context: content }),
          });
          const result = await res.json();
          if (result.success && result.data) {
            updatedWords[i] = {
              ...updatedWords[i],
              pinyin: result.data.pinyin || updatedWords[i].pinyin,
              explanation: result.data.explanation || updatedWords[i].explanation,
              english: result.data.english || updatedWords[i].english,
              example: result.data.example || updatedWords[i].example,
              examplePinyin: result.data.examplePinyin || updatedWords[i].examplePinyin,
            };
            setWords([...updatedWords]);
          }
        } catch (err) {
          console.error(`Failed to generate detail for word ${w.text}:`, err);
        }
      }

      const updatedArticle = getUpdatedArticle(updatedWords);
      onSaveArticle(updatedArticle);
      setAiMessage('✨ 已成功為所有分詞自動補全「拼音、英文翻譯、中文解釋與造句」！');
    } catch (e) {
      console.error('Batch generate error:', e);
      alert('批量生成發生錯誤，請稍後重試。');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  // Save current teacher edits manually
  const handleSaveAll = () => {
    const updatedArticle = getUpdatedArticle();
    onSaveArticle(updatedArticle);
    alert('已成功儲存文章修改！所有變更均已即時保存。');
  };
  const handleGenerateSingleWordDetail = async (index: number) => {
    const targetWord = words[index];
    if (!targetWord || targetWord.isPunctuation || !targetWord.text.trim()) return;

    const wordText = targetWord.text;
    setWords((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        pinyin: '補全中...',
        explanation: 'AI 詞庫生成中...',
        english: 'Generating...',
        example: 'AI 造句中...',
      };
      return updated;
    });

    try {
      const res = await fetch('/api/generate-word-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordText, context: content }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data;
        setWords((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            pinyin: data.pinyin || '',
            explanation: data.explanation || '',
            english: data.english || '',
            example: data.example || '',
            examplePinyin: data.examplePinyin || '',
          };
          return updated;
        });
      }
    } catch (e) {
      console.error('Failed to generate single word detail:', e);
    }
  };

  // Add custom word and auto-generate details via Gemini API
  const handleAddCustomWord = async () => {
    const inputWord = prompt('請輸入欲新增的中文詞語：', '');
    if (!inputWord || !inputWord.trim()) return;

    const wordText = inputWord.trim();
    const tempId = `custom-${Date.now()}`;

    const newWord: SegmentedWord = {
      id: tempId,
      text: wordText,
      pinyin: '生成中...',
      explanation: 'AI 生成中...',
      english: 'Generating...',
      example: 'AI 造句中...',
      examplePinyin: '...',
      isPunctuation: false,
    };

    setWords((prev) => [...prev, newWord]);

    try {
      const res = await fetch('/api/generate-word-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordText, context: content }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data;
        setWords((prev) =>
          prev.map((w) =>
            w.id === tempId
              ? {
                  ...w,
                  pinyin: data.pinyin || '',
                  explanation: data.explanation || '',
                  english: data.english || '',
                  example: data.example || '',
                  examplePinyin: data.examplePinyin || '',
                }
              : w
          )
        );
      }
    } catch (e) {
      console.error('Failed to generate custom word details:', e);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Title Card */}
        <div className="bg-amber-900 text-amber-50 rounded-3xl p-6 sm:p-8 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Edit3 className="w-4 h-4" />
              <span>教師模式專屬編輯面板</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-serif">
              管理與編輯文章：《{title || '新文章'}》
            </h2>
            <p className="text-amber-200 text-xs sm:text-sm mt-1">
              您在此處修改的所有標題、本文、分詞、拼音與詞庫，將即時保存並提供給學生模式使用。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold shadow-md transition-all transform active:scale-95"
            >
              <Save className="w-5 h-5" />
              <span>儲存修改</span>
            </button>

            <button
              onClick={() => onDeleteArticle(article.id)}
              className="p-2.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
              title="刪除文章"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Generator Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white rounded-3xl p-6 shadow-md border border-emerald-700/50 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-stone-950 flex items-center justify-center font-extrabold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-emerald-300">
                  AI 一鍵自動分詞與詞庫生成 (Gemini Powered)
                </h3>
                <p className="text-xs text-stone-300">
                  輸入文章內容後，點選下方按鈕，AI 將自動完成漢語拼音標註、詞語分解與釋義編撰。
                </p>
              </div>
            </div>

            <button
              onClick={handleAiAutoAnalyze}
              disabled={isAiProcessing}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                isAiProcessing
                  ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-stone-950'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>{isAiProcessing ? 'AI 分析處理中...' : '✨ 自動生成分詞與詞庫'}</span>
            </button>
          </div>

          {aiMessage && (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{aiMessage}</span>
            </div>
          )}
        </div>

        {/* Basic Information Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 text-lg border-b border-stone-100 pb-2">
            1. 文章基本資料
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">文章標題</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">標題拼音</label>
              <input
                type="text"
                value={titlePinyin}
                onChange={(e) => setTitlePinyin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">閱讀難度</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              >
                <option value="初級">初級</option>
                <option value="中級">中級</option>
                <option value="高級">高級</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">分類標籤</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">文章原文內容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-stone-300 text-base leading-relaxed h-36 font-serif"
              placeholder="在此處輸入或貼上中文文章..."
            />
          </div>
        </div>

        {/* Word Segmentation & Dictionary Management Canvas */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">
                2. 分詞與詞庫管理 ({words.filter((w) => !w.isPunctuation).length} 個詞語)
              </h3>
              <p className="text-xs text-stone-500">
                點選下方任何詞語卡片，可進行微調拼音、釋義，或是合併、拆解分詞。
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchGenerateAllDetails}
                disabled={isBatchGenerating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                title="呼叫 AI 自動為所有分詞生成/補全拼音、英文翻譯、中文解釋與造句"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isBatchGenerating ? 'AI 補全中...' : '✨ 批量自動生成詞庫資料'}</span>
              </button>

              <button
                onClick={handleAddCustomWord}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>手動新增詞語</span>
              </button>
            </div>
          </div>

          {/* Word Dictionary Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-2xl bg-white shadow-sm">
            {words.length === 0 ? (
              <div className="text-stone-400 text-sm italic py-8 text-center w-full">
                尚未生成分詞。請先輸入上方原文並點選「✨ 自動生成分詞與詞庫」。
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 border-b border-stone-200 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[100px]">詞語</th>
                    <th className="py-3 px-3 min-w-[110px]">拼音</th>
                    <th className="py-3 px-3 min-w-[120px]">英文翻譯</th>
                    <th className="py-3 px-3 min-w-[180px]">中文解釋</th>
                    <th className="py-3 px-3 min-w-[200px]">造句</th>
                    <th className="py-3 px-3 w-28 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {words.map((word, idx) => {
                    if (word.isPunctuation) {
                      return (
                        <tr key={word.id || idx} className="bg-stone-50/60 text-stone-400 text-xs">
                          <td className="py-2 px-3 text-center font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-stone-500" colSpan={5}>
                            標點符號：<span className="text-stone-800 text-sm">{word.text}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => {
                                const updated = words.filter((_, i) => i !== idx);
                                setWords(updated);
                              }}
                              className="text-rose-500 hover:text-rose-700 text-xs"
                            >
                              刪除
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    const isSelected = selectedWordIndex === idx;

                    return (
                      <tr
                        key={word.id || idx}
                        className={`transition-colors ${
                          isSelected ? 'bg-amber-50 font-medium' : 'hover:bg-stone-50/80'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-xs font-mono text-stone-400">
                          {idx + 1}
                        </td>

                        {/* 詞語 */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={word.text}
                            onChange={(e) => {
                              const updated = [...words];
                              updated[idx].text = e.target.value;
                              setWords(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 font-bold font-serif text-sm"
                          />
                        </td>

                        {/* 拼音 */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={word.pinyin || ''}
                            onChange={(e) => {
                              const updated = [...words];
                              updated[idx].pinyin = e.target.value;
                              setWords(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-stone-200 bg-stone-50 focus:bg-white text-emerald-700 font-mono text-xs"
                            placeholder="拼音"
                          />
                        </td>

                        {/* 英文翻譯 */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={word.english || ''}
                            onChange={(e) => {
                              const updated = [...words];
                              updated[idx].english = e.target.value;
                              setWords(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 text-xs"
                            placeholder="English"
                          />
                        </td>

                        {/* 中文解釋 */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={word.explanation || ''}
                            onChange={(e) => {
                              const updated = [...words];
                              updated[idx].explanation = e.target.value;
                              setWords(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 text-xs"
                            placeholder="中文解釋"
                          />
                        </td>

                        {/* 造句 */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={word.example || ''}
                            onChange={(e) => {
                              const updated = [...words];
                              updated[idx].example = e.target.value;
                              setWords(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-stone-200 bg-stone-50 focus:bg-white text-stone-900 text-xs font-serif"
                            placeholder="造句例句"
                          />
                        </td>

                        {/* 操作 */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleGenerateSingleWordDetail(idx)}
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              title="✨ AI 自動補全/重新生成拼音與解釋"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>

                            {idx < words.length - 1 && !words[idx + 1].isPunctuation && (
                              <button
                                onClick={() => handleMergeNext(idx)}
                                className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600"
                                title="與右側詞合併"
                              >
                                <Merge className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {word.text.length > 1 && (
                              <button
                                onClick={() => handleSplitWord(idx)}
                                className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600"
                                title="拆解為單字"
                              >
                                <Split className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                const updated = words.filter((_, i) => i !== idx);
                                setWords(updated);
                              }}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600"
                              title="刪除詞語"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Detailed Selected Word Inspector */}
          {selectedWordIndex !== null && words[selectedWordIndex] && (
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-300 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-base">
                  <Edit3 className="w-5 h-5 text-amber-700" />
                  <span>修改單一詞語詳情: 「{words[selectedWordIndex].text}」</span>
                </div>

                <button
                  onClick={() => {
                    const word = words[selectedWordIndex];
                    if (word) {
                      const currentArticleState = getUpdatedArticle();
                      onSaveArticle(currentArticleState);
                      onSelectWordDetail(word);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium"
                >
                  前往詞語專屬完整頁面 ➔
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">詞語漢字</label>
                  <input
                    type="text"
                    value={words[selectedWordIndex].text}
                    onChange={(e) => {
                      const updated = [...words];
                      updated[selectedWordIndex].text = e.target.value;
                      setWords(updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">漢語拼音 (含聲調)</label>
                  <input
                    type="text"
                    value={words[selectedWordIndex].pinyin || ''}
                    onChange={(e) => {
                      const updated = [...words];
                      updated[selectedWordIndex].pinyin = e.target.value;
                      setWords(updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">英文翻譯</label>
                  <input
                    type="text"
                    value={words[selectedWordIndex].english || ''}
                    onChange={(e) => {
                      const updated = [...words];
                      updated[selectedWordIndex].english = e.target.value;
                      setWords(updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">中文解釋</label>
                <textarea
                  value={words[selectedWordIndex].explanation || ''}
                  onChange={(e) => {
                    const updated = [...words];
                    updated[selectedWordIndex].explanation = e.target.value;
                    setWords(updated);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm h-16"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">造句例句</label>
                  <input
                    type="text"
                    value={words[selectedWordIndex].example || ''}
                    onChange={(e) => {
                      const updated = [...words];
                      updated[selectedWordIndex].example = e.target.value;
                      setWords(updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">造句拼音</label>
                  <input
                    type="text"
                    value={words[selectedWordIndex].examplePinyin || ''}
                    onChange={(e) => {
                      const updated = [...words];
                      updated[selectedWordIndex].examplePinyin = e.target.value;
                      setWords(updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
