import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { searchDocuments, r2r } from '@/lib/r2r-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages, searchMode = 'rag' } = await req.json();
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Bad Request: No user message found', { status: 400 });
    }

    console.log('Search mode:', searchMode);

    // Choose between RAG and Agent mode
    if (searchMode === 'agent') {
      // Use R2R's Agent functionality
      try {
        const agentResponse = await r2r.retrieval.agent({
          message: {
            role: 'user',
            content: lastMessage.content
          },
          ragGenerationConfig: {
            model: 'openai/gpt-4o-mini',
            temperature: 0.7,
            stream: false
          }
        });

        console.log('R2R Agent response:', agentResponse);

        // Return the Agent response as a stream
        const result = streamText({
          model: openai('gpt-4o-mini'),
          messages: [
            {
              role: 'assistant',
              content: agentResponse.results?.completion || agentResponse.results?.generatedAnswer || 'I apologize, but I couldn\'t generate a response based on your documents.'
            }
          ],
        });

        return result.toDataStreamResponse();
      } catch (agentError) {
        console.error('Agent error, falling back to search + LLM:', agentError);
      }
    } else {
      // Use R2R's RAG functionality (default)
      try {
        const ragResponse = await r2r.retrieval.rag({
          query: lastMessage.content,
          ragGenerationConfig: {
            model: 'openai/gpt-4o-mini',
            temperature: 0.7,
            stream: false
          }
        });

        console.log('R2R RAG response:', ragResponse);

        // Return the RAG response as a stream
        const result = streamText({
          model: openai('gpt-4o-mini'),
          messages: [
            {
              role: 'assistant',
              content: ragResponse.results?.completion || ragResponse.results?.generatedAnswer || 'I apologize, but I couldn\'t generate a response based on your documents.'
            }
          ],
        });

        return result.toDataStreamResponse();
      } catch (ragError) {
        console.error('RAG error, falling back to search + LLM:', ragError);
      }
    }
      
    // Fallback to search + LLM approach
    const searchResults = await searchDocuments(lastMessage.content, 5);
    
    // Create context from search results
    const context = searchResults.length > 0
      ? searchResults
          .map((result, index) => `[${index + 1}] ${result.text}`)
          .join('\n\n')
      : 'No relevant documents found.';

    // Create enhanced prompt with context
    const enhancedMessages = [
      {
        role: 'system',
        content: `You are a helpful assistant with access to a knowledge base. Use the following context to answer questions. If the context doesn't contain relevant information, say so and provide a general response.

Context from knowledge base:
${context}`,
      },
      ...messages,
    ];

    // Stream the response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: enhancedMessages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}