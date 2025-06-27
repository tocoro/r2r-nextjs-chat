'use client';

import React, { useState, useRef } from 'react';
import { Send, Paperclip, FileText, X } from 'lucide-react';

interface TextInputFormProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
  placeholder?: string;
}

const TextInputForm: React.FC<TextInputFormProps> = ({
  input,
  onChange,
  onSubmit,
  onKeyPress,
  disabled,
  placeholder = "Ask away"
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allowedTypes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/json'
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        invalidFiles.push(`${file.name} (ファイルサイズが大きすぎます)`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (サポートされていないファイル形式)`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      alert(`以下のファイルは選択できませんでした:\n${invalidFiles.join('\n')}`);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<boolean> => {
    if (selectedFiles.length === 0) return true;

    setIsUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      setSelectedFiles([]);
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      alert('ファイルのアップロードに失敗しました。');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Upload files first if any
    if (selectedFiles.length > 0) {
      const uploadSuccess = await uploadFiles();
      if (!uploadSuccess) return;
    }

    // Then submit the text
    onSubmit(e);
  };

  return (
    <div className="p-4 border-t border-gray-200">
      {/* File Upload Area */}
      {selectedFiles.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-2">添付ファイル:</div>
          <div className="space-y-1">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs"
              >
                <div className="flex items-center gap-1">
                  <FileText size={12} className="text-gray-500" />
                  <span className="truncate max-w-32">{file.name}</span>
                  <span className="text-gray-400">({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <div
            className={`relative ${isDragOver ? 'bg-purple-50 border-purple-300' : ''} rounded-lg`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onChange}
              onKeyPress={onKeyPress}
              placeholder={selectedFiles.length > 0 ? "ファイルについて質問してください..." : placeholder}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={disabled || isUploading}
            />
            
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
              disabled={disabled || isUploading}
            >
              <Paperclip size={16} />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.pdf,.doc,.docx,.md,.json,.csv"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Drag Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 border-2 border-dashed border-purple-400 bg-purple-50 bg-opacity-90 rounded-lg flex items-center justify-center z-10">
              <div className="text-purple-600 text-sm font-medium">
                ファイルをドロップしてください
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={(!input.trim() && selectedFiles.length === 0) || disabled || isUploading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors flex items-center justify-center min-w-[48px]"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>

      {/* File Type Info */}
      <div className="mt-2 text-xs text-gray-500">
        対応ファイル: PDF, Word, テキスト, Markdown, CSV, JSON (最大10MB)
      </div>
    </div>
  );
};

export default TextInputForm;