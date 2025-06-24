import { r2rClient } from 'r2r-js';

// Type definitions
export interface SearchResult {
  text: string;
  metadata: {
    [key: string]: any;
  };
  score: number;
}

export interface R2RSearchResponse {
  results: {
    search_results: SearchResult[];
  };
}

// Initialize R2R client - using the pattern from R2R-Application
export const r2r = new r2rClient(process.env.R2R_BASE_URL || 'http://localhost:7272');

// Helper function to search documents using R2R
export async function searchDocuments(query: string, limit: number = 5): Promise<any[]> {
  try {
    console.log('Attempting to search with R2R:', {
      query,
      limit
    });
    
    const response = await r2r.retrieval.search({
      query,
      searchSettings: {
        limit,
        useHybridSearch: true
      }
    });
    
    console.log('R2R search response:', response);
    
    // Extract search results from the response
    return response.results?.chunkSearchResults || response.results || [];
  } catch (error) {
    console.error('Detailed R2R search error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to ingest document - following R2R-Application pattern
export async function ingestDocument(file: File, metadata?: Record<string, any>) {
  try {
    console.log('Attempting to upload document:', {
      fileName: file.name,
      fileSize: file.size,
      metadata
    });

    const response = await r2r.documents.create({
      file: file,
      metadata: {
        title: file.name,
        ...metadata
      }
    });

    console.log('Document upload response:', response);
    return response;
  } catch (error) {
    console.error('Detailed document upload error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      fileName: file.name
    });
    throw new Error(`Failed to ingest document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}