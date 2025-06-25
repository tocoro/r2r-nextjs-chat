'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, FileText, Hash, Star } from 'lucide-react';

interface SearchResult {
  id: string;
  documentId: string;
  ownerId: string;
  collectionIds: string[];
  score: number;
  text: string;
  metadata?: any;
}

interface SearchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResult: SearchResult | null;
  shortId: string;
}

export default function SearchResultModal({ isOpen, onClose, searchResult, shortId }: SearchResultModalProps) {
  if (!searchResult) return null;

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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Search Result [{shortId}]
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
                    <h4 className="font-medium text-gray-700 mb-2">Content:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{searchResult.text}</p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center text-sm">
                      <Star className="h-4 w-4 text-yellow-400 mr-2" />
                      <span className="font-medium text-gray-600">Relevance Score:</span>
                      <span className="ml-2 text-gray-800 font-medium">
                        {(searchResult.score * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-600">Document ID:</span>
                      <span className="ml-2 text-gray-800 font-mono text-xs">
                        {searchResult.documentId}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Hash className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-600">Chunk ID:</span>
                      <span className="ml-2 text-gray-800 font-mono text-xs">
                        {searchResult.id}
                      </span>
                    </div>

                    {searchResult.metadata && Object.keys(searchResult.metadata).length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-600 text-sm">Metadata:</span>
                        <div className="mt-2 space-y-1">
                          {Object.entries(searchResult.metadata).map(([key, value]) => (
                            <div key={key} className="flex text-xs">
                              <span className="font-medium text-gray-500 w-24 flex-shrink-0">{key}:</span>
                              <span className="text-gray-700 break-all">
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResult.collectionIds && searchResult.collectionIds.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-600 text-sm">Collections:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {searchResult.collectionIds.map((collectionId, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {collectionId.substring(0, 8)}...
                            </span>
                          ))}
                        </div>
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