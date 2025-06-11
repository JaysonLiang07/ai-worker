import { createSchema, createYoga } from 'graphql-yoga';

// 环境变量接口
interface Env {
  DEEPSEEK_API_KEY: string;  // DeepSeek API 密钥
  PAGES_DOMAIN: string;     // Pages 项目域名
  DOMAIN: string;           // 自定义域名
}

// DeepSeek API 响应类型定义
interface DeepSeekMessage {
  role: string;
  content: string;
}

interface DeepSeekChoice {
  index: number;
  message: DeepSeekMessage;
  finish_reason: string;
}

interface DeepSeekUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: DeepSeekChoice[];
  usage: DeepSeekUsage;
}

// 生成 CORS 响应头
function getCORSHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = 
    origin.includes('localhost') || origin.includes('127.0.0.1') 
      ? origin 
      : origin.endsWith(env.DOMAIN) ? origin : '*';
      
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

// 处理非 API 请求转发
async function forwardToPages(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = `https://${env.PAGES_DOMAIN}${url.pathname}${url.search}`;
  
  try {
    console.log(`转发请求到 Pages: ${targetUrl}`);
    const response = await fetch(targetUrl, request);
    
    // 处理 HTML 响应的编码问题
    const contentType = response.headers.get('Content-Type') || '';
    const newHeaders = new Headers(response.headers);
    
    // 强制 HTML 响应使用 UTF-8 编码
    if (contentType.includes('text/html')) {
      newHeaders.set('Content-Type', 'text/html; charset=utf-8');
    }
    
    // 复制原始响应，添加 CORS 头
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('转发请求失败:', error);
    return new Response(`转发请求失败: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const isLocal = url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1');
    
    console.log(`[${new Date().toISOString()}] 收到请求: ${request.method} ${path}`);
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCORSHeaders(request, env),
      });
    }
    
    // 本地开发模式（跳过转发，返回提示信息）
    if (isLocal) {
      console.log('[本地开发] 跳过 Pages 转发');
      
      // 处理 /favicon.ico 请求
      if (path === '/favicon.ico') {
        return new Response(null, { status: 204 });
      }
      
      // 处理 API 请求
      if (path.startsWith('/api/')) {
        // API 处理逻辑将在下方定义
      } else {
        // 非 API 请求返回开发提示
        return new Response('本地开发模式: 已禁用 Pages 转发', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }
    
    // 生产环境: 非 API 请求转发到 Pages
    if (!path.startsWith('/api/')) {
      return forwardToPages(request, env);
    }
    
    // API 请求处理: 创建 GraphQL 服务器
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            ask(prompt: String!): String!
            chat(messages: [MessageInput!]!): String!
          }
          
          input MessageInput {
            role: String!
            content: String!
          }
        `,
        resolvers: {
          Query: {
            ask: async (_: any, { prompt }: { prompt: string }) => {
              console.log('[GraphQL] 处理 ask 查询:', prompt);
              
              try {
                const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                  }),
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('[DeepSeek错误]', response.status, errorText);
                  throw new Error(`DeepSeek API 错误: ${response.status} ${errorText}`);
                }
                
                const data = (await response.json()) as DeepSeekResponse;
                console.log('[DeepSeek响应]', data.choices?.[0]?.message?.content?.substring(0, 50) + '...');
                return data.choices?.[0]?.message?.content || '无返回内容';
              } catch (error: any) {
                console.error('[API调用失败]', error.message);
                throw new Error(`处理请求失败: ${error.message}`);
              }
            },
            
            chat: async (_: any, { messages }: { messages: { role: string; content: string }[] }) => {
              console.log('[GraphQL] 处理 chat 查询:', messages);
              
              try {
                // 验证输入
                if (!messages || messages.length === 0) {
                  throw new Error('消息列表不能为空');
                }
                
                const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages,
                  }),
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('[DeepSeek错误]', response.status, errorText);
                  throw new Error(`DeepSeek API 错误: ${response.status} ${errorText}`);
                }
                
                const data = (await response.json()) as DeepSeekResponse;
                console.log('[DeepSeek响应]', data.choices?.[0]?.message?.content?.substring(0, 50) + '...');
                return data.choices?.[0]?.message?.content || '无返回内容';
              } catch (error: any) {
                console.error('[API调用失败]', error.message);
                throw new Error(`处理请求失败: ${error.message}`);
              }
            },
          },
        },
      }),
      landingPage: false,
      cors: false, // 禁用内置 CORS，使用自定义处理
      graphiql: true, // 开发环境启用 GraphiQL
      graphqlEndpoint: path,
      logging: true,
    });
    
    try {
      // 处理 GraphQL 请求
      const response = await yoga.fetch(request, { req: request, env, ctx });
      
      // 应用 CORS 头
      const corsHeaders = getCORSHeaders(request, env);
      const newHeaders = new Headers(response.headers);
      
      for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value);
      }
      
      return new Response(response.body, { ...response, headers: newHeaders });
    } catch (error: any) {
      console.error('[GraphQL处理错误]', error.message);
      return new Response(
        JSON.stringify({ errors: [{ message: error.message }] }),
        {
          status: 500,
          headers: {
            ...getCORSHeaders(request, env),
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};