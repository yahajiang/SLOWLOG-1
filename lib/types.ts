/**
 * Post 类型定义
 * 用于前端组件的数据结构
 */

import type { ContentCategory } from "./categories";

export interface Post {
  id: string;
  title: string;
  titleZh: string;
  excerpt: string;
  excerptZh: string;
  category: ContentCategory;
  author: string;
  authorInitial: string;
  date: string;
  displayDate: string;
  readTime: string;
  featured?: boolean;
  draft?: boolean;
  tags: string[];
  markdown: string;
  markdownZh: string;
  html: string;
  htmlZh: string;
  headings: { id: string; text: string }[];
  headingsZh: { id: string; text: string }[];
  createdAt?: string;
}
