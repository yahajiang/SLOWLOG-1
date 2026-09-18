import { prisma } from "./prisma"

type PublishedPostInput = {
  id: string
  title?: string | null
  titleZh?: string | null
  slug?: string | null
  excerpt?: string | null
  excerptZh?: string | null
}

function envConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT?.trim()
}

export function isFcmConfigured(): boolean {
  return envConfigured()
}

/**
 * 文章发布后的 FCM 广播。失败只打日志，绝不抛出、绝不阻断发布。
 * 未配置 FIREBASE_SERVICE_ACCOUNT 或无设备时直接返回。
 */
export async function notifyPublishedPost(post: PublishedPostInput): Promise<void> {
  if (!envConfigured()) return
  try {
    const devices = await prisma.appDevice.findMany({
      select: { fcmToken: true },
      take: 1000,
    })
    if (!devices.length) return

    const tokens = devices.map((d) => d.fcmToken)
    const title = post.titleZh || post.title || "慢日志"
    const body = (post.excerptZh || post.excerpt || "有新文章发布").slice(0, 80)

    const { initializeApp, getApps, cert } = await import("firebase-admin/app")
    const { getMessaging } = await import("firebase-admin/messaging")

    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)
    const existing = getApps()
    const app =
      existing[0] ??
      initializeApp({
        credential: cert({
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key,
        }),
      })

    const messaging = getMessaging(app)
    await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { postId: post.id, slug: post.slug || "" },
    })
  } catch (e) {
    console.error("[fcm] notifyPublishedPost failed:", e)
  }
}
