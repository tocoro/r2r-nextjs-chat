import { auth } from "@/auth"
import { Shield, LogOut } from 'lucide-react'
import Link from 'next/link'
import ChatClientPage from './ChatClientPage'
import { redirect } from 'next/navigation'

async function signOutAction() {
  "use server"
  const { signOut } = await import("@/auth")
  await signOut({ redirect: true, redirectTo: '/login' })
}

export default async function Home() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Search modes will be added by client component */}
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-semibold text-gray-900">R2R Chat</h1>
            </div>
            
            {/* Right side - User Info, Admin Link, and Logout */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.name || 'ユーザー'}
                {session.user?.role === 'admin' && (
                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    管理者
                  </span>
                )}
              </span>
              
              {/* Admin Link - only show for admin users */}
              {session.user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span>ユーザー管理</span>
                </Link>
              )}
              
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>ログアウト</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Client Component */}
      <ChatClientPage />
    </div>
  )
}