/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Article, SegmentedWord, AppMode } from './types';
import {
  getSavedArticles,
  saveArticles,
  getActiveArticleId,
  setActiveArticleId,
  saveSingleArticle,
  deleteArticle,
  restoreDefaultArticles,
} from './services/storage';
import { Header } from './components/Header';
import { StudentReader } from './components/StudentReader';
import { WordDetailPage } from './components/WordDetailPage';
import { TeacherEditor } from './components/TeacherEditor';
import { ArticleListModal } from './components/ArticleListModal';

export default function App() {
  // 1. Application Mode: 'student' or 'teacher'
  const [mode, setMode] = useState<AppMode>('student');

  // 2. Saved Articles & Active Article State
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeArticleId, setActiveId] = useState<string>('');

  // 3. Navigation View State: 'reader' | 'word-detail' | 'teacher-editor'
  const [currentView, setCurrentView] = useState<'reader' | 'word-detail' | 'teacher-editor'>('reader');
  const [selectedWord, setSelectedWord] = useState<SegmentedWord | null>(null);

  // 4. Modal state for selecting articles
  const [isArticleModalOpen, setIsArticleModalOpen] = useState<boolean>(false);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'teacher') {
      setMode('teacher');
    }

    const loadedArticles = getSavedArticles();
    setArticles(loadedArticles);

    const savedActiveId = getActiveArticleId();
    if (loadedArticles.some((a) => a.id === savedActiveId)) {
      setActiveId(savedActiveId);
    } else if (loadedArticles.length > 0) {
      setActiveId(loadedArticles[0].id);
    }
  }, []);

  const activeArticle = articles.find((a) => a.id === activeArticleId) || articles[0];

  // Handle Mode Change
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === 'teacher') {
      // In teacher mode, if user was on reader, navigate to teacher editor
      if (currentView === 'reader') {
        setCurrentView('teacher-editor');
      }
    } else {
      // Return to student reader
      setCurrentView('reader');
    }
  };

  // Handle Article Selection
  const handleSelectArticle = (article: Article) => {
    setActiveId(article.id);
    setActiveArticleId(article.id);
    setSelectedWord(null);
    setCurrentView(mode === 'teacher' ? 'teacher-editor' : 'reader');
  };

  // Handle Word Click -> Direct Jump to Word Detail Page
  const handleSelectWord = (word: SegmentedWord) => {
    setSelectedWord(word);
    setCurrentView('word-detail');
  };

  // Handle Return to Article View from Word Detail Page
  const handleBackToArticle = () => {
    setCurrentView(mode === 'teacher' ? 'teacher-editor' : 'reader');
    setSelectedWord(null);
  };

  // Handle Save Article from Teacher Editor or Word Detail Edit
  const handleSaveArticle = (updatedArticle: Article) => {
    const updatedList = saveSingleArticle(updatedArticle);
    setArticles(updatedList);
    setActiveId(updatedArticle.id);
  };

  // Handle Word Detail Inline Update
  const handleUpdateSingleWord = (updatedWord: SegmentedWord) => {
    if (!activeArticle) return;
    const exists = activeArticle.words.some((w) => w.id === updatedWord.id);
    let updatedWords: SegmentedWord[];
    if (exists) {
      updatedWords = activeArticle.words.map((w) =>
        w.id === updatedWord.id ? updatedWord : w
      );
    } else {
      updatedWords = [...activeArticle.words, updatedWord];
    }
    const updatedArticle = { ...activeArticle, words: updatedWords };
    handleSaveArticle(updatedArticle);
    setSelectedWord(updatedWord);
  };

  // Handle Add New Article in Teacher Mode
  const handleAddNewArticle = () => {
    const newArticle: Article = {
      id: `art-${Date.now()}`,
      title: '新文章',
      titlePinyin: 'xīn wén zhāng',
      level: '初級',
      category: '自訂故事',
      content: '在此處輸入要閱讀與教學的繁體中文文本...',
      words: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updatedList = saveSingleArticle(newArticle);
    setArticles(updatedList);
    setActiveId(newArticle.id);
    setActiveArticleId(newArticle.id);
    setMode('teacher');
    setCurrentView('teacher-editor');
  };

  // Handle Delete Article
  const handleDeleteArticle = (articleId: string) => {
    const updatedList = deleteArticle(articleId);
    setArticles(updatedList);
    if (updatedList.length > 0) {
      setActiveId(updatedList[0].id);
      setActiveArticleId(updatedList[0].id);
    }
    setCurrentView('reader');
  };

  // Handle Restore Default Articles
  const handleRestoreDefaults = () => {
    if (confirm('確定要恢復預設的華語範例文章嗎？')) {
      const defaults = restoreDefaultArticles();
      setArticles(defaults);
      setActiveId(defaults[0].id);
      setActiveArticleId(defaults[0].id);
      setCurrentView('reader');
    }
  };

  if (!activeArticle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 text-stone-600">
        載入中文閱讀平台中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Header with Mode Switcher & Navigation */}
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        activeArticle={activeArticle}
        onOpenArticleList={() => setIsArticleModalOpen(true)}
        onOpenNewArticle={handleAddNewArticle}
      />

      {/* Main View Router */}
      <main>
        {currentView === 'word-detail' && selectedWord ? (
          <WordDetailPage
            key={`${activeArticle.id}-${selectedWord.id}`}
            word={selectedWord}
            article={activeArticle}
            mode={mode}
            onBackToArticle={handleBackToArticle}
            onUpdateWord={handleUpdateSingleWord}
          />
        ) : currentView === 'teacher-editor' && mode === 'teacher' ? (
          <TeacherEditor
            key={activeArticle.id}
            article={activeArticle}
            onSaveArticle={handleSaveArticle}
            onDeleteArticle={handleDeleteArticle}
            onSelectWordDetail={handleSelectWord}
          />
        ) : (
          <StudentReader
            key={activeArticle.id}
            article={activeArticle}
            mode={mode}
            onSelectWord={handleSelectWord}
            onOpenArticleList={() => setIsArticleModalOpen(true)}
          />
        )}
      </main>

      {/* Article Selection Modal */}
      <ArticleListModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        articles={articles}
        activeArticleId={activeArticleId}
        onSelectArticle={handleSelectArticle}
        onRestoreDefaults={handleRestoreDefaults}
        onDeleteArticle={handleDeleteArticle}
        mode={mode}
        onAddNewArticle={handleAddNewArticle}
      />
    </div>
  );
}
