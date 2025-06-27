import { type UseChatOptions } from 'ai/react';

/**
 * Vercel AI SDKの`useChat`フックは、エラーパートのペイロードが文字列であることを期待します。
 * しかし、サーバーがオブジェクト（例: `{ "message": "..." }`）を返す場合、
 * クライアント側でパースエラーが発生します。
 *
 * このTransformStreamは、サーバーからのストリームを監視し、
 * エラー形式がオブジェクトだった場合に文字列に変換することで、この問題を解決します。
 */
function createErrorNormalizingStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 最後の不完全な行はバッファに残す

      for (const line of lines) {
        if (line.startsWith('3:')) { // '3'はVercel AI SDKのエラーパートのコード
          try {
            const payloadJSON = line.substring(2);
            const payload = JSON.parse(payloadJSON);

            // ペイロードがオブジェクトで、messageプロパティを持つ場合
            if (typeof payload === 'object' && payload !== null && 'message' in payload) {
              // messageプロパティを文字列として再エンコードする
              const errorMessage = JSON.stringify(payload.message || 'An error occurred.');
              const fixedLine = `3:${errorMessage}`;
              controller.enqueue(encoder.encode(fixedLine + '\n'));
            } else {
              // すでに期待される形式（文字列）であれば、そのまま流す
              controller.enqueue(encoder.encode(line + '\n'));
            }
          } catch (e) {
            // パースに失敗した場合も、そのまま流してSDK側でエラーを処理させる
            controller.enqueue(encoder.encode(line + '\n'));
          }
        } else {
          // エラーパートでなければ、そのまま流す
          controller.enqueue(encoder.encode(line + '\n'));
        }
      }
    },
    flush(controller) {
      // ストリーム終了時にバッファに残っているデータを処理する
      if (buffer) {
        controller.enqueue(encoder.encode(buffer));
      }
    },
  });
}

/**
 * `useChat`に渡すためのカスタムfetch関数。
 * サーバーからのレスポンスをラップし、エラー形式を正規化します。
 */
export const customFetch: UseChatOptions['fetch'] = async (input, init) => {
  const response = await fetch(input, init);

  if (response.ok && response.body) {
    const newBody = response.body.pipeThrough(createErrorNormalizingStream());

    return new Response(newBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  return response;
};