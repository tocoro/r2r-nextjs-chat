import { auth } from "@/auth"
import { getAllUsers, createUser, updateUser, deleteUser, logAction } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, UserPlus, Edit, Trash2, Shield, User as UserIcon, FileText, ArrowLeft } from "lucide-react"

async function createUserAction(formData: FormData) {
  "use server"
  
  const session = await auth()
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as "admin" | "user"
  
  try {
    await createUser({
      id: username,
      username,
      email,
      role,
      is_active: true
    })
    
    // Log the action
    if (session?.user?.id) {
      await logAction(session.user.id, 'CREATE_USER', username)
    }
  } catch (error) {
    console.error("Error creating user:", error)
  }
  
  redirect("/admin")
}

async function toggleUserStatus(formData: FormData) {
  "use server"
  
  const session = await auth()
  const username = formData.get("username") as string
  const currentStatus = formData.get("currentStatus") === "true"
  
  try {
    await updateUser(username, { is_active: !currentStatus })
    
    // Log the action
    if (session?.user?.id) {
      const action = currentStatus ? 'DEACTIVATE_USER' : 'ACTIVATE_USER'
      await logAction(session.user.id, action, username)
    }
  } catch (error) {
    console.error("Error updating user:", error)
  }
  
  redirect("/admin")
}

async function deleteUserAction(formData: FormData) {
  "use server"
  
  const session = await auth()
  const username = formData.get("username") as string
  
  try {
    await deleteUser(username)
    
    // Log the action
    if (session?.user?.id) {
      await logAction(session.user.id, 'DELETE_USER', username)
    }
  } catch (error) {
    console.error("Error deleting user:", error)
  }
  
  redirect("/admin")
}

export default async function AdminPage() {
  const session = await auth()
  
  // Check if user is authenticated and is admin
  if (!session?.user || session.user.role !== "admin") {
    redirect("/")
  }
  
  const users = await getAllUsers()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                チャットに戻る
              </Link>
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/documents"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FileText className="h-4 w-4 mr-2" />
                ドキュメント管理
              </Link>
              <div className="text-sm text-gray-500">
                管理者: {session.user.name}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
            
            {/* Create User Form */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                新規ユーザー作成
              </h2>
              <form action={createUserAction} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    ユーザー名
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="ユーザー名"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    権限
                  </label>
                  <select
                    name="role"
                    id="role"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value="user">一般ユーザー</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    作成
                  </button>
                </div>
              </form>
            </div>
            
            {/* Users List */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                ユーザー一覧 ({users.length}名)
              </h2>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        権限
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終ログイン
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-indigo-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === "admin" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {user.role === "admin" ? "管理者" : "一般ユーザー"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {user.is_active ? "アクティブ" : "無効"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login ? user.last_login.toLocaleString("ja-JP") : "未ログイン"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <form action={toggleUserStatus} className="inline">
                            <input type="hidden" name="username" value={user.username} />
                            <input type="hidden" name="currentStatus" value={user.is_active.toString()} />
                            <button
                              type="submit"
                              className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${
                                user.is_active
                                  ? "text-red-700 bg-red-100 hover:bg-red-200"
                                  : "text-green-700 bg-green-100 hover:bg-green-200"
                              }`}
                            >
                              {user.is_active ? "無効化" : "有効化"}
                            </button>
                          </form>
                          {user.username !== "admin" && (
                            <form action={deleteUserAction} className="inline">
                              <input type="hidden" name="username" value={user.username} />
                              <button
                                type="submit"
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                削除
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}