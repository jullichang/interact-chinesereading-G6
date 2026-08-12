import React from 'react';
import { AppMode, Article } from '../types';
import { BookOpen, GraduationCap, UserCheck, PlusCircle, Sparkles, FolderOpen, Volume2 } from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  activeArticle: Article;
  onOpenArticleList: () => void;
  onOpenNewArticle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  activeArticle,
  onOpenArticleList,
  onOpenNewArticle,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-inner font-bold text-xl">
            華
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-stone-100 tracking-wide">
                華語互動閱讀平台
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">
                漢語拼音與雙模式
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {mode === 'student' ? '學生互動閱讀模式 (點選詞語聽發音、看解釋)' : '教師教學管理模式 (自由編輯分詞與詞庫)'}
            </p>
          </div>
        </div>

        {/* Current Article Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenArticleList}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm border border-stone-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate font-medium">
              {activeArticle.title}
            </span>
            <span className="text-xs bg-stone-900 text-stone-400 px-1.5 py-0.5 rounded">
              切換文章
            </span>
          </button>

          {mode === 'teacher' && (
            <button
              onClick={onOpenNewArticle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>新增文章</span>
            </button>
          )}
        </div>

        {/* Role Switcher Toggle */}
        <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => onModeChange('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'student'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>學生模式</span>
            {mode === 'student' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>}
          </button>

          <button
            onClick={() => onModeChange('teacher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'teacher'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>教師模式</span>
            {mode === 'teacher' && <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>}
          </button>
        </div>
      </div>
    </header>
  );
};
