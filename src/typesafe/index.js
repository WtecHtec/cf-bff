/**
 * TypeSafe AI BFF 代理处理器
 *
 * 解决浏览器前端跨域 (CORS) 问题，将游戏请求安全转发至 TypeSafe API：
 * https://api.typesafe.ai/v1/systemone
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * 处理对 TypeSafe API 的代理请求
 * @param {Request} request 
 * @param {object} env 
 * @returns {Promise<Response>}
 */
export async function handleTypesafe(request, env = {}) {
  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // 仅支持 POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '方法不支持，请使用 POST 请求' }), {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: '请求体必须是合法的 JSON' }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    }

    // 提取 API Key（优先级：Authorization 头 > 请求体中的 apiKey > 环境变量）
    let apiKey = '';
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader) {
      apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
    } else if (payload && payload.apiKey) {
      apiKey = String(payload.apiKey).trim();
    } else if (env && env.TYPESAFE_API_KEY) {
      apiKey = String(env.TYPESAFE_API_KEY).trim();
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: '未提供 TypeSafe API Key（可通过 Authorization 头部、请求体中的 apiKey 字段或环境变量 TYPESAFE_API_KEY 传递）',
      }), {
        status: 401,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    }

    // 清理可能随 payload 传过来的 apiKey 字段，避免污染上游请求
    if (payload && payload.apiKey) {
      delete payload.apiKey;
    }

    // 上游 TypeSafe 目标地址
    const targetUrl = (env && env.TYPESAFE_API_URL) || 'https://api.typesafe.ai/v1/systemone';

    // 转发请求到 TypeSafe
    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await upstreamRes.text();

    return new Response(responseBody, {
      status: upstreamRes.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': upstreamRes.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: `TypeSafe 代理请求发生异常: ${error.message}`,
    }), {
      status: 502,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  }
}

export default handleTypesafe;
