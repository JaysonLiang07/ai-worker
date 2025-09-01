# AI Worker

一个强大的AI工作处理服务，专为处理各种AI任务和操作而设计。

## 🚀 功能特性

- **可扩展处理**: 支持并发处理多个AI任务
- **模型支持**: 支持多种AI模型和框架
- **队列管理**: 高效的任务队列系统处理作业
- **API集成**: 提供RESTful API便于集成
- **监控功能**: 内置健康检查和性能监控
- **Docker支持**: 容器化部署就绪

## 📋 环境要求

运行此项目前，请确保已安装：

- Node.js (v18 或更高版本)
- npm 或 yarn
- Docker (可选，用于容器化部署)

## 🛠️ 安装步骤

```bash
# 克隆仓库
git clone https://github.com/[用户名]/ai-worker.git

# 进入项目目录
cd ai-worker

# 安装依赖
npm install

# 设置环境变量
cp .env.example .env
```

## ⚙️ 配置说明

创建 `.env` 文件并配置以下变量：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# AI服务配置
AI_MODEL_PATH=/path/to/models
MAX_CONCURRENT_JOBS=5

# 数据库配置（如适用）
DATABASE_URL=your_database_url

# API密钥（如需要）
OPENAI_API_KEY=your_openai_api_key
```

## 🚀 使用方法

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm run build
npm start
```

### 使用Docker
```bash
# 构建镜像
docker build -t ai-worker .

# 运行容器
docker run -p 3000:3000 ai-worker
```

## 📡 API接口

### 提交任务
```http
POST /api/jobs
Content-Type: application/json

{
  "task": "text-generation",
  "input": "你的输入数据",
  "options": {
    "model": "gpt-3.5-turbo"
  }
}
```

### 检查任务状态
```http
GET /api/jobs/:jobId
```

### 获取任务结果
```http
GET /api/jobs/:jobId/result
```

## 🏗️ 项目结构

```
ai-worker/
├── src/
│   ├── controllers/     # API控制器
│   ├── services/        # 业务逻辑
│   ├── models/          # 数据模型
│   ├── utils/           # 工具函数
│   └── workers/         # 工作进程
├── tests/               # 测试文件
├── docker/              # Docker配置
└── docs/                # 文档
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试
npm test -- --grep "worker"
```

## 📊 监控

服务包含内置监控端点：

- 健康检查: `GET /health`
- 性能指标: `GET /metrics`
- 服务状态: `GET /status`

## 🤝 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📝 许可证

此项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 技术支持

如果遇到问题或有疑问：

- 查看 [Issues](https://github.com/[用户名]/ai-worker/issues) 页面
- 如果问题未被报告，请创建新issue
- 加入我们的社区讨论

## 🔗 相关项目

- [AI Page](https://github.com/[用户名]/ai-page) - AI Worker的前端界面
- [Code Review Mastra App](https://github.com/[用户名]/code_review_mastra_app) - 代码审查自动化

---

用 ❤️ 为AI社区打造
