'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, FileText, Hash } from 'lucide-react';

interface Citation {
  id: string;
  document_id: string;
  chunk_id?: string;
  text: string;
  score: number;
  metadata?: any;
}

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
  citationNumber: number;
}

export default function CitationModal({ isOpen, onClose, citation, citationNumber }: CitationModalProps) {
  if (!citation) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Source [{citationNumber}]
                  </h3>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <div className="mt-4 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{citation.text}</p>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-600">Document ID:</span>
                      <span className="ml-2 text-gray-800 font-mono text-xs">
                        {citation.document_id.substring(0, 8)}...
                      </span>
                    </div>
                    
                    {citation.chunk_id && (
                      <div className="flex items-center text-sm">
                        <Hash className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-600">Chunk ID:</span>
                        <span className="ml-2 text-gray-800 font-mono text-xs">
                          {citation.chunk_id.substring(0, 8)}...
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-gray-600">Relevance Score:</span>
                      <span className="ml-2 text-gray-800">
                        {(citation.score * 100).toFixed(1)}%
                      </span>
                    </div>

                    {citation.metadata && Object.keys(citation.metadata).length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-600 text-sm">Metadata:</span>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(citation.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}