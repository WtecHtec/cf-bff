// 在文件最顶部添加这行代码
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 环境变量
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_MODEL = process.env.ZHIPU_MODEL || 'glm-4-air-250414';

// 添加调试信息
console.log('�� 环境变量检查:');
console.log('ZHIPU_API_KEY:', ZHIPU_API_KEY ? '已设置' : '未设置');
console.log('ZHIPU_MODEL:', ZHIPU_MODEL);

// 健康检查端点
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 消息端点
app.get('/message', (req, res) => {
	res.json({ message: 'Hello, World!' });
});

// 随机 UUID 端点
app.get('/random', (req, res) => {
	const { randomUUID } = require('crypto');
	res.json({ uuid: randomUUID() });
});

// 聊天端点
app.post('/chat', async (req, res) => {
	try {
		const { content } = req.body;

		// 验证必要参数
		if (!content) {
			return res.status(400).json({ 
				error: '缺少必要参数: content' 
			});
		}

		// 检查 API Key
		if (!ZHIPU_API_KEY) {
			return res.status(500).json({ 
				error: '未配置 API Key' 
			});
		}

		// 调用智谱 AI 接口
		const response = await axios.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
			model: ZHIPU_MODEL,
			messages: [
				{
					role: 'user',
					content: content
				}
			]
		}, {
			headers: {
				'Authorization': `Bearer ${ZHIPU_API_KEY}`,
				'Content-Type': 'application/json',
			}
		});

		res.json(response.data);

	} catch (error) {
		console.error('Chat API Error:', error);
		
		if (error.response) {
			// 服务器响应了错误状态码
			res.status(error.response.status).json({ 
				error: `智谱 AI 接口调用失败: ${error.response.status} ${error.response.data}` 
			});
		} else if (error.request) {
			// 请求已发出但没有收到响应
			res.status(500).json({ 
				error: '网络请求失败，请检查网络连接' 
			});
		} else {
			// 其他错误
			res.status(500).json({ 
				error: `服务器内部错误: ${error.message}` 
			});
		}
	}
});

// 404 处理
app.use('*', (req, res) => {
	res.status(404).json({ error: 'Not Found' });
});

// 错误处理中间件
app.use((error, req, res, next) => {
	console.error('Server Error:', error);
	res.status(500).json({ 
		error: '服务器内部错误' 
	});
});

// 启动服务器
app.listen(PORT, () => {
	console.log(`🚀 服务器运行在端口 ${PORT}`);
	console.log(`📊 健康检查: http://localhost:${PORT}/health`);
	console.log(`💬 聊天接口: http://localhost:${PORT}/chat`);
});

module.exports = app;