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

        console.log('R2R Agent response:', JSON.stringify(agentResponse, null, 2));

        // Extract the agent's response content - check for messages array first
        let content = '';
        
        if (agentResponse.results?.messages && Array.isArray(agentResponse.results.messages)) {
          // Find the assistant message in the messages array
          const assistantMessage = agentResponse.results.messages.find(
            (msg: any) => msg.role === 'assistant'
          );
          content = assistantMessage?.content || '';
        }
        
        // Fallback to other possible fields
        if (!content) {
          content = agentResponse.results?.completion || 
                   agentResponse.results?.generatedAnswer || 
                   'I apologize, but I couldn\'t generate a response based on your documents.';
        }

        console.log('Extracted agent content:', content);

        // Extract search results from agent response (if available)
        const searchResults = agentResponse.results?.searchResults?.chunkSearchResults || [];
        
        console.log('Extracted agent search results:', searchResults.length, 'results');

        // Create mapping of short IDs to full search results
        const idToResult: { [key: string]: any } = {};
        searchResults.forEach((result: any) => {
          if (result.id) {
            // Use first 7 characters of ID as short ID
            const shortId = result.id.substring(0, 7);
            idToResult[shortId] = result;
          }
        });

        console.log('Final agent content:', content);

        // Return Agent content as streaming response (same implementation as RAG mode)
        const encoder = new TextEncoder();
        
        const stream = new ReadableStream({
          async start(controller) {
            try {
              // First send search results metadata if available
              if (Object.keys(idToResult).length > 0) {
                const metadataEvent = `8:[{"type":"searchResults","data":${JSON.stringify(idToResult)}}]\n`;
                console.log('Sending metadata event (Agent mode):', metadataEvent);
                controller.enqueue(encoder.encode(metadataEvent));
              }
              
              // Split content into words for natural streaming
              const words = content.split(' ');
              
              // Send each word as a text delta with proper streaming delay
              for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const textDelta = i === 0 ? word : ' ' + word;
                
                // Proper escaping for AI SDK Data Stream Protocol
                const escapedText = textDelta
                  .replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');
                
                // AI SDK Data Stream Protocol format: 0:"text_delta"
                const data = `0:"${escapedText}"\n`;
                controller.enqueue(encoder.encode(data));
                
                // Add delay for streaming effect (30ms per word)
                if (i < words.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 30));
                }
              }
              
              // Send completion event
              controller.enqueue(encoder.encode('3:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'));
              
              // Send final data event
              controller.enqueue(encoder.encode('d:{}\n'));
              
            } catch (error) {
              console.error('Agent streaming error:', error);
              // Send error event
              controller.enqueue(encoder.encode('3:{"finishReason":"error","usage":{"promptTokens":0,"completionTokens":0}}\n'));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
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

        console.log('R2R RAG response:', JSON.stringify(ragResponse, null, 2));

        // Extract content and search results
        const content = ragResponse.results?.completion || 
                       ragResponse.results?.generatedAnswer || 
                       'I apologize, but I couldn\'t generate a response based on your documents.';
        
        const searchResults = ragResponse.results?.searchResults?.chunkSearchResults || [];
        
        console.log('Extracted search results:', searchResults.length, 'results');

        // Create mapping of short IDs to full search results
        const idToResult: { [key: string]: any } = {};
        searchResults.forEach((result: any) => {
          if (result.id) {
            // Use first 7 characters of ID as short ID
            const shortId = result.id.substring(0, 7);
            idToResult[shortId] = result;
          }
        });

        console.log('Final content:', content);

        // Return R2R content as streaming response using AI SDK Data Stream Protocol
        const encoder = new TextEncoder();
        
        const stream = new ReadableStream({
          async start(controller) {
            try {
              // First send search results metadata if available
              if (Object.keys(idToResult).length > 0) {
                const metadataEvent = `8:[{"type":"searchResults","data":${JSON.stringify(idToResult)}}]\n`;
                console.log('Sending metadata event (RAG mode):', metadataEvent);
                controller.enqueue(encoder.encode(metadataEvent));
              }
              
              // Split content into words for natural streaming
              const words = content.split(' ');
              
              // Send each word as a text delta with proper streaming delay
              for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const textDelta = i === 0 ? word : ' ' + word;
                
                // Proper escaping for AI SDK Data Stream Protocol
                const escapedText = textDelta
                  .replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');
                
                // AI SDK Data Stream Protocol format: 0:"text_delta"
                const data = `0:"${escapedText}"\n`;
                controller.enqueue(encoder.encode(data));
                
                // Add delay for streaming effect (30ms per word)
                if (i < words.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 30));
                }
              }
              
              // Send completion event
              controller.enqueue(encoder.encode('3:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'));
              
              // Send final data event
              controller.enqueue(encoder.encode('d:{}\n'));
              
            } catch (error) {
              console.error('Streaming error:', error);
              // Send error event
              controller.enqueue(encoder.encode('3:{"finishReason":"error","usage":{"promptTokens":0,"completionTokens":0}}\n'));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
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