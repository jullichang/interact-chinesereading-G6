import { Article } from '../types';
import { SAMPLE_ARTICLES } from '../data/sampleArticles';

const ARTICLES_KEY = 'zh_reading_articles_v1';
const ACTIVE_ARTICLE_KEY = 'zh_reading_active_id_v1';

export function getSavedArticles(): Article[] {
  try {
    const raw = localStorage.getItem(ARTICLES_KEY);
    if (!raw) {
      saveArticles(SAMPLE_ARTICLES);
      return SAMPLE_ARTICLES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_ARTICLES;
  } catch (e) {
    console.error('Failed to load articles from storage:', e);
    return SAMPLE_ARTICLES;
  }
}

export function saveArticles(articles: Article[]): void {
  try {
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
  } catch (e) {
    console.error('Failed to save articles:', e);
  }
}

export function getActiveArticleId(): string {
  try {
    const id = localStorage.getItem(ACTIVE_ARTICLE_KEY);
    if (id) return id;
  } catch (e) {
    // fallback
  }
  return SAMPLE_ARTICLES[0].id;
}

export function setActiveArticleId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_ARTICLE_KEY, id);
  } catch (e) {
    console.error('Failed to set active article id:', e);
  }
}

export function saveSingleArticle(article: Article): Article[] {
  const articles = getSavedArticles();
  const index = articles.findIndex((a) => a.id === article.id);
  if (index >= 0) {
    articles[index] = article;
  } else {
    articles.unshift(article);
  }
  saveArticles(articles);
  return articles;
}

export function deleteArticle(articleId: string): Article[] {
  const articles = getSavedArticles().filter((a) => a.id !== articleId);
  saveArticles(articles);
  return articles;
}

export function restoreDefaultArticles(): Article[] {
  saveArticles(SAMPLE_ARTICLES);
  return SAMPLE_ARTICLES;
}
