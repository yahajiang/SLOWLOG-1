import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  return (
    <div className="min-h-screen bg-[var(--dash-bg)] flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col relative z-[2]">
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
