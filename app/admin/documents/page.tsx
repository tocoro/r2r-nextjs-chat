import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DocumentUploadClient from "./DocumentUploadClient"
import Link from "next/link"
import { Shield, ArrowLeft } from "lucide-react"

export default async function DocumentsPage() {
  const session = await auth()
  
  // Check if user is authenticated and is admin
  if (!session?.user || session.user.role !== "admin") {
    redirect("/")
  }
  
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
                <h1 className="text-2xl font-bold text-gray-900">ドキュメント管理</h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              管理者: {session.user.name}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <DocumentUploadClient />
        </div>
      </div>
    </div>
  )
}