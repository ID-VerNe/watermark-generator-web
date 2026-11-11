# Contributing to Watermark Generator

欢迎对本仓库做贡献。本文件是**外部贡献入口**（给首次进入仓库的人读）；仓库内 Agent 与协作者
直接看 [AGENTS.md](AGENTS.md)。两者冲突时以 AGENTS.md 为准。

## 这是什么项目

基于 **React 19 + Vite + Tailwind CSS 4** 的在线图片水印生成器，为照片批量添加统一的
相机 / 镜头 / 地点水印。纯前端，数据全部存浏览器 `localStorage`，无服务端、无网络请求。

## 环境要求

- Node.js 18+ 与 npm（`npm install` / `npm run dev` / `npm run build`）
- Python 3（跑门禁脚本，**只用标准库**，无需安装任何包）

## 开发流程：五步

仓库内所有改动走五步流程（细则见 [`docs/contributing/`](docs/contributing/)）：

1. **先发 issue**：正文四要素（现象 + 复现命令 / 证据链 / 影响面 / 修复候选）。
   模板在 [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/)。
2. **写 plan 追评**：探索结论 + 方案 + 明确不做 + 验证方式。
3. **开 worktree 改代码**：`git worktree add ../watermark-<issue> -b type/<issue>-<slug> master`。
4. **开 PR**：正文分段齐全，行为类用 `Refs #NN`、纯文档/重构用 `Closes #NN`；
   合并审批由独立上下文的会话评审。
5. **合并后对账与回签**：行为类等浏览器验证通过才关 issue。

## 门禁怎么跑

```bash
python scripts/run_gates.py --list   # 看档位与顺序
python scripts/run_gates.py ci       # 全量门禁（提交 / push 前必跑）
```

门禁清单的唯一事实来源是 `scripts/gates.json`；CI 跑同一份。钩子在 `.githooks/`，
换机器后重设：`git config core.hooksPath .githooks`。

## 红线（节选）

- 逐个 `git add <file>`，禁止 `git add .` / `-A`。
- 不留红 commit；不写物理行号引用（见 AGENTS.md §2）。
- 禁止 `Co-Authored-By:` 行。
- 逆向还原中间产物（`restored/`、`rea-analysis.json`、`dist/`）不入库。

完整红线见 [AGENTS.md](AGENTS.md) §2。