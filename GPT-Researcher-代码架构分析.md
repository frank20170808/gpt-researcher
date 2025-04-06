# GPT-Researcher 代码架构与功能分析

> **GitHub仓库地址**：[https://github.com/assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher)

---

## 1. 项目整体架构概览

GPT-Researcher 是一个基于 LLM 的自主研究代理，支持本地和网络研究，生成带引用的综合报告。  
项目采用 **多智能体架构**，结合 **Python FastAPI 后端**、**Next.js + TypeScript 前端**，并集成多种 LLM 模型。

- **前端** (`/frontend`)：Next.js + TypeScript + Tailwind CSS，提供用户界面。
- **后端** (`/backend`)：FastAPI，处理API请求，协调多智能体。
- **多智能体系统** (`/multi_agents`)：基于LangChain和LangGraph，定义Browser、Researcher、Writer等角色。
- **核心库** (`/gpt_researcher`)：封装LLM调用、爬虫、检索、提示词、技能等。
- **配置** (`/gpt_researcher/config`)：模型参数、API密钥、环境变量。
- **测试** (`/tests`)：单元、集成、端到端测试。

---

## 2. 代码文件依赖关系

- **前端**依赖Next.js框架，调用后端API。
- **后端**依赖FastAPI，调用`gpt_researcher`核心库。
- **多智能体**通过`multi_agents`定义，依赖`gpt_researcher`的agent、skills、retrievers等。
- **配置**文件被后端和核心库加载。
- **测试**依赖核心库和后端API。

---

## 3. 功能模块调用逻辑

- 用户通过前端发起研究请求。
- FastAPI后端接收请求，初始化多智能体流程。
- 多智能体系统分配任务：
  - **Browser**爬取网页内容。
  - **Researcher**分析资料。
  - **Writer**生成报告。
- 过程中调用：
  - `gpt_researcher/agent.py` 定义的Agent基类。
  - `gpt_researcher/prompts.py` 提示词模板。
  - `gpt_researcher/scraper/` 爬虫工具。
  - `gpt_researcher/retrievers/` 检索工具。
  - `gpt_researcher/skills/` 具体技能。
- 结果汇总后，生成带引用的报告，返回前端。

---

## 4. 关键代码文件定位索引

| 文件/目录 | 主要功能 |
| --- | --- |
| `gpt_researcher/agent.py` | 定义Agent基类，封装LLM交互 |
| `gpt_researcher/prompts.py` | 提示词模板 |
| `gpt_researcher/actions/` | 具体操作行为 |
| `gpt_researcher/skills/` | 领域技能 |
| `gpt_researcher/scraper/` | 网页爬虫 |
| `gpt_researcher/retrievers/` | 检索模块 |
| `gpt_researcher/config/` | 配置文件 |
| `backend/server/server.py` | FastAPI服务入口 |
| `multi_agents/agent.py` | 多智能体定义 |
| `frontend/` | Next.js前端代码 |
| `tests/` | 测试代码 |

---

## 5. 工作流程

1. **用户请求**：通过前端界面提交研究主题。
2. **任务分配**：后端调用多智能体系统，分配任务。
3. **资料收集**：Browser爬取网页，Retriever检索资料。
4. **内容理解**：Researcher分析资料，调用LLM。
5. **报告生成**：Writer根据提示词生成结构化报告。
6. **结果返回**：后端将报告返回前端展示。

---

## 6. 项目亮点

- **多智能体协作**：Browser、Researcher、Writer等角色分工明确。
- **LangChain + LangGraph**：实现复杂的智能体流程。
- **支持多模型**：GPT-4、GPT-3.5、Claude等。
- **丰富的输出格式**：PDF、Markdown、DOCX。
- **模块化设计**：爬虫、检索、提示词、技能分离，易于扩展。
- **严格的类型安全**：TypeScript前端，Python类型注解。
- **丰富的测试覆盖**：单元、集成、端到端测试。

---

## 7. 潜在问题与优化建议

- **多智能体流程复杂**，调试难度较大，建议增加流程可视化工具。
- **LLM调用成本较高**，可增加缓存与复用策略。
- **爬虫模块需加强异常处理**，避免因网页结构变化导致失败。
- **前端用户体验可优化**，如增加进度反馈。
- **配置管理分散**，建议统一配置中心。
- **部分模块缺少详细文档**，建议补充。

---

## 8. 结语

GPT-Researcher 采用模块化、多智能体架构，结合多种技术栈，实现了强大的自动化研究与报告生成能力。代码结构清晰，设计合理，具备良好的扩展性和维护性。

---

**文档生成时间：2025-04-05**