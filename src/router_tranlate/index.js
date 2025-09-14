import { systemPrompt } from "./prompt";

async function handle(request, env) {
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
				thinking:  {
					type: 'disabled'
				} ,
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
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

export default handle;
