import { z } from "zod";

/**
 * 写接口统一校验（后端审查 P1-3）。
 * 约定：错误响应统一 { error: string }（中文），由 lib/api-utils.ts apiError 输出。
 */

const slugField = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9-]+$/, "slug 仅限字母、数字与连字符")
  .max(120);

const colorField = z
  .string()
  .trim()
  .max(64)
  .regex(
    /^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\([\s\d.,%]+\)|hsla?\([\s\d.,%]+\)|oklch\([\s\d.,%]+\)|[a-zA-Z]+)$/,
    "颜色格式不合法"
  );

/** 渲染配置白名单（写入时即归一，渲染端 parsePageConfig 再兜底） */
export const pageConfigSchema = z.object({
  layout: z.enum(["standard", "magazine", "fullscreen"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  primaryColor: colorField.optional(),
  fontFamily: z.enum(["sans", "serif"]).optional(),
  backgroundColor: colorField.optional(),
  maxWidth: z.enum(["narrow", "medium", "wide"]).optional(),
  showTOC: z.boolean().optional(),
});

const tiptapDoc = z.record(z.string(), z.unknown());

export const postCreateSchema = z.object({
  title: z.string().trim().min(1, "标题必填").max(200),
  titleZh: z.string().trim().max(200).optional(),
  slug: slugField.optional(),
  excerpt: z.string().max(2000).optional(),
  excerptZh: z.string().max(2000).optional(),
  content: tiptapDoc.optional(),
  status: z.enum(["draft", "published"]).optional(),
  categoryId: z.string().min(1).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20, "标签最多 20 个").optional(),
  pageConfig: pageConfigSchema.optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(300).optional(),
  seoKeywords: z.array(z.string().trim().min(1).max(30)).max(15).optional(),
  readTime: z.string().max(30).optional(),
  author: z.string().max(60).optional(),
  authorInitial: z.string().max(4).optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().max(40).optional(),
});

export const postUpdateSchema = postCreateSchema
  .extend({
    summary: z.string().max(2000).optional(),
    seoTitleZh: z.string().max(120).optional(),
    seoDescriptionZh: z.string().max(300).optional(),
    noIndex: z.boolean().optional(),
    ogImage: z.string().max(500).optional(),
    canonicalUrl: z.string().max(500).optional(),
  })
  .partial();

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "名称必填").max(60),
  nameZh: z.string().trim().max(60).optional(),
  slug: slugField,
  description: z.string().max(300).optional(),
  descriptionZh: z.string().max(300).optional(),
  coverImageUrl: z.string().max(500).optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const thoughtSchema = z
  .object({
    text: z.string().max(500, "随想最多 500 字").optional(),
    textZh: z.string().max(500, "随想最多 500 字").optional(),
    content: z.string().max(500, "随想最多 500 字").optional(),
  })
  .refine((d) => (d.textZh || d.text || d.content || "").trim().length > 0, {
    message: "内容不能为空",
  });

export const settingsSchema = z.object({
  siteName: z.string().trim().max(60).optional(),
  siteNameEn: z.string().trim().max(60).optional(),
  siteDescription: z.string().trim().max(300).optional(),
  siteDescriptionEn: z.string().trim().max(300).optional(),
  siteKeywords: z.string().trim().max(200).optional(),
  siteIconUrl: z.string().trim().max(500).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  footerText: z.string().trim().max(300).optional(),
  footerTextEn: z.string().trim().max(300).optional(),
  socialLinks: z.unknown().optional(),
  postsPerPage: z.number().int().min(1).max(100).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    email: z
      .string()
      .trim()
      .min(3, "请输入有效邮箱")
      .max(120)
      .refine((v) => v.includes("@"), "请输入有效邮箱"),
    password: z.string().min(8, "密码至少 8 位"),
    confirmPassword: z.string().optional(),
    name: z.string().trim().min(1, "请输入名称").max(60),
  })
  .refine((d) => !d.confirmPassword || d.confirmPassword === d.password, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });
