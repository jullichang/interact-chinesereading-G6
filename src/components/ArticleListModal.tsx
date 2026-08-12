import React, { useState } from 'react';
import { Article, AppMode } from '../types';
import { X, BookOpen, Plus, Trash2, RotateCcw, Check, Sparkles } from 'lucide-react';

interface ArticleListModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  activeArticleId: string;
  onSelectArticle: (article: Article) => void;
  onRestoreDefaults: () => void;
  onDeleteArticle: (id: string) => void;
  mode: AppMode;
  onAddNewArticle: () => void;
}

export const ArticleListModal: React.FC<ArticleListModalProps> = ({
  isOpen,
  onClose,
  articles,
  activeArticleId,
  onSelectArticle,
  onRestoreDefaults,
  onDeleteArticle,
  mode,
  onAddNewArticle,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('全部');

  if (!isOpen) return null;

  const filteredArticles = articles.filter((a) => {
    if (filterLevel === '全部') return true;
    return a.level === filterLevel;
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif">選擇閱讀文章</h2>
              <p className="text-xs text-stone-400">共有 {articles.length} 篇可供閱讀的故事與課文</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Filters & Teacher Actions */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">難度篩選:</span>
            {['全部', '初級', '中級', '高級'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterLevel === lvl
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {mode === 'teacher' && (
              <button
                onClick={() => {
                  onClose();
                  onAddNewArticle();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>新增文章</span>
              </button>
            )}

            <button
              onClick={onRestoreDefaults}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700"
              title="恢復預設經典文章"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置範例</span>
            </button>
          </div>
        </div>

        {/* Articles Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-3 divide-y divide-stone-100 flex-1">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">
              無符合篩選難度的文章。
            </div>
          ) : (
            filteredArticles.map((article) => {
              const isActive = article.id === activeArticleId;

              return (
                <div
                  key={article.id}
                  className={`pt-3 first:pt-0 group flex items-start justify-between gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 border-2 border-emerald-400 shadow-sm'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                  onClick={() => {
                    onSelectArticle(article);
                    onClose();
                  }}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {article.level}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                        {article.category}
                      </span>
                      {isActive && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>閱讀中</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 font-serif group-hover:text-emerald-700 transition-colors">
                      {article.title}
                    </h3>

                    {article.titlePinyin && (
                      <p className="text-xs font-mono text-emerald-600">
                        {article.titlePinyin}
                      </p>
                    )}

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed pt-1 font-serif">
                      {article.content}
                    </p>
                  </div>

                  {mode === 'teacher' && articles.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`確定要刪除《${article.title}》嗎？`)) {
                          onDeleteArticle(article.id);
                        }
                      }}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="刪除文章"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500">
          選擇欲閱讀的文章後，學生可隨時點選詞語聽發音、看造句與隱藏拼音。
        </div>
      </div>
    </div>
  );
};
