export type Lang = "zh" | "en";

export const LANG_LABEL: Record<Lang, string> = {
  zh: "中文",
  en: "EN",
};

export const dict = {
  zh: {
    // Site
    siteName: "慢日志",
    siteSlogan: "深度思考，缓慢进化",
    siteDescription: "慢下来，写点值得读的东西。关于设计、代码与思考的个人博客。",
    // Nav
    navHome: "首页",
    navPosts: "文章",
    navAdmin: "后台",
    // Search
    searchPlaceholder: "搜索文章...",
    // Hero
    featured: "推荐",
    readArticle: "阅读文章",
    inThisIssue: "本期内容",
    inThisIssueDesc: (count: number, cats: number) =>
      `${count} 篇文章，覆盖 ${cats} 个分类`,
    // Grid
    latestArticles: "最新文章",
    allArticles: "全部文章",
    resultsFor: (q: string) => `搜索 "${q}"`,
    noArticles: "未找到文章",
    noArticlesHint: "试试调整搜索词或浏览其他分类",
    clearFilters: "清除筛选",
    // Thinking
    thinking: "随想",
    // Timeline
    browseTimeline: "按时间线浏览",
    timelineDesc: (count: number) => `全部 ${count} 篇文章，按年份分组`,
    viewAll: "查看全部",
    // Footer
    footerSlogan: "慢日志 — 用时间沉淀文字",
    footerBuilt: "基于 Next.js 与 Tailwind CSS 构建",
    // Post detail
    backToPosts: "← 返回文章",
    onThisPage: "本页目录",
    previous: "上一篇",
    next: "下一篇",
    noPrevious: "没有更早的文章了",
    noNext: "没有更新的文章了",
    minRead: "分钟阅读",
    // Admin
    adminTitle: "后台 · Markdown 编辑",
    viewBlog: "查看博客",
    newPost: "新建文章",
    totalPosts: "文章总数",
    categories: "分类数",
    storage: "存储方式",
    storageValue: "content/posts/*.md",
    searchHint: "搜索标题、摘要、标签...",
    noMatch: "没有匹配的文章",
    createFirst: "创建第一篇",
    postsCount: (n: number, cat?: string, q?: string) => {
      let s = `${n} 篇文章`;
      if (cat && cat !== "All") s += ` · ${cat}`;
      if (q) s += ` · 搜索 "${q}"`;
      return s;
    },
    clickToEdit: "点击编辑 · 支持 Markdown 图形化",
    loading: "加载中...",
    preview: "预览",
    edit: "编辑",
    delete: "删除",
    cancel: "取消",
    save: "保存",
    saving: "保存中...",
    publish: "发布",
    publishSuccess: "发布成功",
    updateSuccess: "已更新",
    deleteSuccess: "已删除",
    deleteConfirm: (id: string) => `确定删除 "${id}"？此操作会删除 content/posts/${id}.md`,
    // Editor
    editorNew: "新建文章",
    editorTitle: "Markdown 图形化编辑器",
    editorUntitled: "未命名",
    // Form
    formTitle: "标题 *",
    formSlug: "Slug / ID *",
    formExcerpt: "摘要 *",
    formExcerptHint: "一句话概括，显示在卡片与 SEO",
    formCategory: "分类 *",
    formReadTime: "阅读时长",
    formAuthor: "作者",
    formDate: "日期",
    formTags: "标签（逗号分隔）",
    formTagsPlaceholder: "设计, 系统, Tailwind",
    formFeatured: "设为推荐（首页 Hero）",
    formSlugHint: "自动从标题生成",
    // Toolbar
    toolbar: "工具栏",
    toolH2: "H2",
    toolBold: "粗体",
    toolItalic: "斜体",
    toolQuote: "引用",
    toolCode: "代码",
    toolLink: "链接",
    toolList: "列表",
    toolImage: "图片",
    toolBlock: "代码块",
    // Preview modes
    modeEdit: "编辑",
    modeSplit: "分栏",
    modePreview: "预览",
    chars: "字符",
    previewHint: "所见即所得",
    startTyping: "预览区域 — 开始输入以查看效果",
    // Markdown
    markdownLabel: "Markdown",
    // File hint
    fileHint: "Markdown 文件实时写入 content/posts/*.md，保存后刷新首页即生效，npm run build 静态化。",
    // Categories (display names)
    catAll: "全部",
    catDesign: "设计",
    catPlugin: "插件",
    catEngineering: "工程",
    catTypography: "字体",
    catFrontend: "前端",
    catSnippet: "点滴",
    // VersionHistory
    versionHistory: "版本历史",
    noVersions: "暂无版本记录",
    maxVersions: "最多保留 4 个版本",
    restoreVersion: "恢复此版本",
    restoreVersionConfirm: "确定恢复到此版本？当前内容将被替换。",
    versionAgo: (t: string) => t,
    // FindReplace
    findReplace: "查找与替换",
    findPlaceholder: "查找...",
    replacePlaceholder: "替换为...",
    regex: "正则表达式",
    replace: "替换",
    replaceAll: "全部",
    noResults: "无结果",
    // SpecialChar
    specialChars: "特殊字符",
    math: "数学",
    currency: "货币",
    arrows: "箭头",
    punctuation: "标点",
    greek: "希腊字母",
    tables: "制表符",
    misc: "杂项",
    // SourceEditor
    sourceEditor: "Markdown 源码",
    apply: "应用",
    // Error / Not Found
    errorTitle: "出错了",
    errorRetry: "重试",
    notFoundTitle: "页面未找到",
    notFoundBack: "返回首页",
    // Thoughts
    addThought: "添加新随想",
    addThoughtZh: "中文",
    addThoughtEn: "English",
    addBtn: "添加",
    thoughtAdded: "随想已添加",
    thoughtUpdated: "随想已更新",
    thoughtDeleted: "随想已删除",
    noThoughts: "暂无随想",
    saveThought: "保存",
    deleteThoughtConfirm: "确定删除这条随想？",
  },
  en: {
    siteName: "SlowLog",
    siteSlogan: "Think Deep, Evolve Slow",
    siteDescription:
      "Slow down, write something worth reading. A personal blog about design, code, and thinking.",
    navHome: "Home",
    navPosts: "Posts",
    navAdmin: "Admin",
    searchPlaceholder: "Search articles...",
    featured: "Featured",
    readArticle: "Read Article",
    inThisIssue: "In this issue",
    inThisIssueDesc: (count: number, cats: number) =>
      `${count} articles across ${cats} categories.`,
    latestArticles: "Latest Articles",
    allArticles: "All Articles",
    resultsFor: (q: string) => `Search for "${q}"`,
    noArticles: "No articles found",
    noArticlesHint: "Try adjusting your search or browsing a different category.",
    clearFilters: "Clear filters",
    thinking: "Thinking",
    browseTimeline: "Browse by timeline",
    timelineDesc: (count: number) => `All ${count} posts grouped by year`,
    viewAll: "View all",
    footerSlogan: "SlowLog — Where words settle",
    footerBuilt: "Built with Next.js & Tailwind CSS",
    backToPosts: "← Back to posts",
    onThisPage: "On this page",
    previous: "Previous",
    next: "Next",
    noPrevious: "No previous",
    noNext: "No next",
    minRead: "min read",
    adminTitle: "Admin · Markdown",
    viewBlog: "View blog",
    newPost: "New post",
    totalPosts: "Total Posts",
    categories: "Categories",
    storage: "Storage",
    storageValue: "content/posts/*.md",
    searchHint: "Search title, excerpt, tags...",
    noMatch: "No matching posts",
    createFirst: "Create first one",
    postsCount: (n: number, cat?: string, q?: string) => {
      let s = `${n} posts`;
      if (cat && cat !== "All") s += ` · ${cat}`;
      if (q) s += ` · Search "${q}"`;
      return s;
    },
    clickToEdit: "Click to edit · Supports Markdown",
    loading: "Loading...",
    preview: "Preview",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    publish: "Publish",
    publishSuccess: "Published",
    updateSuccess: "Updated",
    deleteSuccess: "Deleted",
    deleteConfirm: (id: string) => `Delete "${id}"? This will remove content/posts/${id}.md`,
    editorNew: "New Post",
    editorTitle: "Markdown Editor",
    editorUntitled: "Untitled",
    formTitle: "Title *",
    formSlug: "Slug / ID *",
    formExcerpt: "Excerpt *",
    formExcerptHint: "One-line summary for card & SEO",
    formCategory: "Category *",
    formReadTime: "Read time",
    formAuthor: "Author",
    formDate: "Date",
    formTags: "Tags (comma separated)",
    formTagsPlaceholder: "Design Tokens, System, Tailwind",
    formFeatured: "Set as Featured (Hero)",
    formSlugHint: "Auto from title",
    toolbar: "Toolbar",
    toolH2: "H2",
    toolBold: "Bold",
    toolItalic: "Italic",
    toolQuote: "Quote",
    toolCode: "Code",
    toolLink: "Link",
    toolList: "List",
    toolImage: "Image",
    toolBlock: "Code Block",
    modeEdit: "Edit",
    modeSplit: "Split",
    modePreview: "Preview",
    chars: "chars",
    previewHint: "What you see is what you get",
    startTyping: "Preview — start typing to see the result",
    markdownLabel: "Markdown",
    fileHint: "Markdown files write to content/posts/*.md. Refresh after save. `next build` for static export.",
    catAll: "All",
    catDesign: "Design",
    catPlugin: "Plugin",
    catEngineering: "Engineering",
    catTypography: "Typography",
    catFrontend: "Frontend",
    catSnippet: "Snippet",
    versionHistory: "Version History",
    noVersions: "No versions yet",
    maxVersions: "Max 4 versions retained",
    restoreVersion: "Restore this version",
    restoreVersionConfirm: "Restore to this version? Current content will be replaced.",
    versionAgo: (t: string) => t,
    findReplace: "Find & Replace",
    findPlaceholder: "Find...",
    replacePlaceholder: "Replace with...",
    regex: "Regex",
    replace: "Replace",
    replaceAll: "All",
    noResults: "No results",
    specialChars: "Special Characters",
    math: "Math",
    currency: "Currency",
    arrows: "Arrows",
    punctuation: "Punctuation",
    greek: "Greek",
    tables: "Tables",
    misc: "Misc",
    sourceEditor: "Markdown Source",
    apply: "Apply",
    errorTitle: "Something went wrong",
    errorRetry: "Retry",
    notFoundTitle: "Page not found",
    notFoundBack: "Back to home",
    addThought: "Add New Thought",
    addThoughtZh: "Chinese",
    addThoughtEn: "English",
    addBtn: "Add",
    thoughtAdded: "Thought added",
    thoughtUpdated: "Thought updated",
    thoughtDeleted: "Thought deleted",
    noThoughts: "No thoughts yet",
    saveThought: "Save",
    deleteThoughtConfirm: "Delete this thought?",
  },
} as const;

export type Dict = {
  siteName: string;
  siteSlogan: string;
  siteDescription: string;
  navHome: string;
  navPosts: string;
  navAdmin: string;
  searchPlaceholder: string;
  featured: string;
  readArticle: string;
  inThisIssue: string;
  inThisIssueDesc: (count: number, cats: number) => string;
  latestArticles: string;
  allArticles: string;
  resultsFor: (q: string) => string;
  noArticles: string;
  noArticlesHint: string;
  clearFilters: string;
  thinking: string;
  browseTimeline: string;
  timelineDesc: (count: number) => string;
  viewAll: string;
  footerSlogan: string;
  footerBuilt: string;
  backToPosts: string;
  onThisPage: string;
  previous: string;
  next: string;
  noPrevious: string;
  noNext: string;
  minRead: string;
  adminTitle: string;
  viewBlog: string;
  newPost: string;
  totalPosts: string;
  categories: string;
  storage: string;
  storageValue: string;
  searchHint: string;
  noMatch: string;
  createFirst: string;
  postsCount: (n: number, cat?: string, q?: string) => string;
  clickToEdit: string;
  loading: string;
  preview: string;
  edit: string;
  delete: string;
  cancel: string;
  save: string;
  saving: string;
  publish: string;
  publishSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
  deleteConfirm: (id: string) => string;
  editorNew: string;
  editorTitle: string;
  editorUntitled: string;
  formTitle: string;
  formSlug: string;
  formExcerpt: string;
  formExcerptHint: string;
  formCategory: string;
  formReadTime: string;
  formAuthor: string;
  formDate: string;
  formTags: string;
  formTagsPlaceholder: string;
  formFeatured: string;
  formSlugHint: string;
  toolbar: string;
  toolH2: string;
  toolBold: string;
  toolItalic: string;
  toolQuote: string;
  toolCode: string;
  toolLink: string;
  toolList: string;
  toolImage: string;
  toolBlock: string;
  modeEdit: string;
  modeSplit: string;
  modePreview: string;
  chars: string;
  previewHint: string;
  startTyping: string;
  markdownLabel: string;
  fileHint: string;
  catAll: string;
  catDesign: string;
  catPlugin: string;
  catEngineering: string;
  catTypography: string;
  catFrontend: string;
  catSnippet: string;
  versionHistory: string;
  noVersions: string;
  maxVersions: string;
  restoreVersion: string;
  restoreVersionConfirm: string;
  versionAgo: (t: string) => string;
  findReplace: string;
  findPlaceholder: string;
  replacePlaceholder: string;
  regex: string;
  replace: string;
  replaceAll: string;
  noResults: string;
  specialChars: string;
  math: string;
  currency: string;
  arrows: string;
  punctuation: string;
  greek: string;
  tables: string;
  misc: string;
  sourceEditor: string;
  apply: string;
  errorTitle: string;
  errorRetry: string;
  notFoundTitle: string;
  notFoundBack: string;
  addThought: string;
  addThoughtZh: string;
  addThoughtEn: string;
  addBtn: string;
  thoughtAdded: string;
  thoughtUpdated: string;
  thoughtDeleted: string;
  noThoughts: string;
  saveThought: string;
  deleteThoughtConfirm: string;
};

export function getDict(lang: Lang): Dict {
  return dict[lang];
}
