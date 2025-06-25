"use client"

import { useState, useRef, DragEvent } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAnalytics } from '@/lib/posthog-client';

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'success' | 'error';
  error?: string;
}

export default function DocumentUploadClient() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { trackEvent } = useAnalytics();

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      fileArray.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'アップロードに失敗しました');
      }

      const result = await response.json();
      
      // Add to uploaded files list
      setUploadedFiles(prev => [...prev, ...fileArray]);
      
      // Add to documents list with success status
      const newDocuments: UploadedDocument[] = fileArray.map((file, index) => ({
        id: result.results[index]?.document_id || `doc-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        status: 'success' as const
      }));
      
      setUploadedDocuments(prev => [...newDocuments, ...prev]);
      
      // Track successful upload
      trackEvent('admin_document_uploaded', {
        fileCount: fileArray.length,
        fileTypes: fileArray.map(f => f.type),
        fileSizes: fileArray.map(f => f.size),
        documentIds: result.results.map((r: any) => r.document_id)
      });
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
      setUploadError(errorMessage);
      
      // Add to documents list with error status
      const errorDocuments: UploadedDocument[] = fileArray.map((file, index) => ({
        id: `error-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        status: 'error' as const,
        error: errorMessage
      }));
      
      setUploadedDocuments(prev => [...errorDocuments, ...prev]);
      
      // Track failed upload
      trackEvent('admin_document_upload_failed', {
        error: errorMessage,
        fileCount: fileArray.length
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div>
      {/* Upload Area */}
      <div 
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload"
          accept=".txt,.pdf,.doc,.docx,.md,.json,.csv"
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg text-gray-600">
            ドキュメントをドラッグ＆ドロップ
          </p>
          <p className="mt-2 text-sm text-gray-500">
            または
            <label htmlFor="file-upload" className="ml-1 text-indigo-600 hover:text-indigo-500 cursor-pointer font-medium">
              ファイルを選択
            </label>
          </p>
          <p className="mt-2 text-xs text-gray-400">
            対応形式: TXT, PDF, DOC, DOCX, MD, JSON, CSV
          </p>
        </div>

        {isUploading && (
          <div className="mt-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-sm text-gray-600">アップロード中...</span>
          </div>
        )}

        {uploadError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      {uploadedDocuments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">アップロード履歴</h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ファイル名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    サイズ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アップロード日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.status === 'success' ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">成功</span>
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">エラー</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                総ドキュメント数
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {uploadedFiles.length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                総サイズ
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                成功率
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {uploadedDocuments.length > 0 
                  ? Math.round((uploadedDocuments.filter(d => d.status === 'success').length / uploadedDocuments.length) * 100)
                  : 0}%
              </dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}