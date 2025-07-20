/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		
		// 处理 CORS 预检请求
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		switch (url.pathname) {
			case '/message':
				return new Response('Hello, World!');
			case '/random':
				return new Response(crypto.randomUUID());
			case '/chat':
				return await handleChat(request, env);
			default:
				return new Response('Not Found', { status: 404 });
		}
	},
};

async function handleChat(request, env) {
	try {
		// 只接受 POST 请求
		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', { 
				status: 405,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json'
				}
			});
		}

		// 解析请求体
		const requestData = await request.json();
		const { content } = requestData;

		// 验证必要参数
		if (!content) {
			return new Response(JSON.stringify({ 
				error: '缺少必要参数: content' 
			}), { 
				status: 400,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json'
				}
			});
		}

		// 检查 API Key
		const apiKey = env.ZHIPU_API_KEY;
		const model = env.ZHIPU_MODEL;
		if (!apiKey) {
			return new Response(JSON.stringify({ 
				error: '未配置 API Key' 
			}), { 
				status: 500,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json'
				}
			});
		}

		// 调用智谱 AI 接口
		const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{
						role: 'user',
						content: content
					}
				]
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			return new Response(JSON.stringify({ 
				error: `智谱 AI 接口调用失败: ${response.status} ${errorText}` 
			}), { 
				status: response.status,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json'
				}
			});
		}

		const result = await response.json();
		
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json'
			}
		});

	} catch (error) {
		return new Response(JSON.stringify({ 
			error: `服务器内部错误: ${error.message}` 
		}), { 
			status: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json'
			}
		});
	}
}