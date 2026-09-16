/**
 * 前台列表常量（纯常量，无副作用——client 组件可安全 import）。
 *
 * ⚠️ 不要把 client 组件需要的常量放进 lib/posts.ts：该文件顶部有
 * next/cache 的 revalidateTag/revalidatePath（仅限服务端），
 * client 打包链一旦拉入即整站 500（实测）。
 */

/** 前台列表每页上限：站点设置的 postsPerPage 可下调，但不允许超过该值 */
export const FRONT_PAGE_SIZE_MAX = 20

/** 首页每个分类分组默认展示的最新篇数（其余走归档/标签页查看） */
export const HOME_GROUP_LIMIT = 8
