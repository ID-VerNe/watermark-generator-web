# AGENTS.md — 本项目协作须知

给在本仓库工作的任何 AI agent（以及新加入的人类）的**协作总纲**。本文篇幅较长（按节查阅，
不必一次读完），改动前至少读完「迭代流程」与「红线」两节。

本文件随仓库 bootstrap 提交建立。**从此之后的每一次改动都走五步流程**，包括改这份文件本身。

「该读哪一节」：

| 你是谁 / 要做什么 | 先读 |
|---|---|
| 第一次进入仓库的 agent 或人 | §0 迭代流程 → §2 红线 |
| 要改代码 | §2 红线 → §3「单一归属」（新代码往哪儿写） |
| 遇到水印渲染 / 持久化问题 | §3 → §4 环境坑 |
| 要改门禁或加门禁 | §0.1（清单唯一事实源在 `scripts/gates.json`） |
| 要发 issue / 开 PR / 做合并评审 | §0 五步 → `docs/contributing/` 三件细则 |
| 同一件事看到两种说法 | §3「事实类型 → 唯一权威」表 |
| 要写 commit / 构建产物 | §5 |

---

## 0. 迭代流程（先读这一节）

所有仓库改动（代码、文档、门禁、配置）走五步，缺一步即不合规。
细则：发 issue 看 [`docs/contributing/ISSUE_GUIDE.md`](docs/contributing/ISSUE_GUIDE.md)，开 PR 看 [`docs/contributing/PR_GUIDE.md`](docs/contributing/PR_GUIDE.md)。

1. **先发 issue（发现即提，不等批准）**：正文四要素齐全——现象（行为类必须带一条可直接粘贴的
   复现命令）/ 证据链（`文件:行号`）/ 影响面（P0–P2）/ 修复候选。给不出复现命令就贴 `needs-repro`。
   issue 是执行与验收的唯一依据。
2. **写 plan 追评到 issue 下面**：探索结论（带证据）+ 方案 + **明确不做** + 验证方式，
   并含一行「用 issue 的复现命令复现：成功 / 失败（贴原始输出）」。复现失败说明描述与现状不符，
   退回补充，不进实施；定稿后只追加不改口。
3. **开 worktree 改代码**：`git worktree add ../watermark-<issue> -b type/<issue>-<slug> master`，
   不在主工作区切分支；分支 / PR 标题 / commit **三处都带 issue 号**。
4. **开 PR**：正文分段齐全（问题 / 改动 / 测试 / 基线验证 / 门禁改动 / 影响面 / 验收对照）；
   `Closes` 只给纯文档与纯重构，**行为类用 `Refs`**。
   **正文里举例一律写 `#NN` 占位**，不写具体编号——GitHub 对 PR 原始全文跑自动关闭解析，
   行内代码 / 围栏里的 closing 关键词加真实编号也会真的关掉 issue（见
   [`docs/contributing/PR_GUIDE.md`](docs/contributing/PR_GUIDE.md)「硬规则」）。
   **合并审批权归独立上下文的会话**：实施会话写完全部文档、门禁转绿后，
   用 `python scripts/review_prompt.py --pr <号>` 生成派发文案（**不要手写**，它默认不带 PR 正文，
   「不投喂结论」靠结构保证），原样交给只拿到 PR 编号、仓库路径与分支/标题/改动文件清单的评审会话；
   它出 `APPROVE` 就直接合并（merge commit，不 squash、不 rebase），
   不需要维护者逐 PR 人工点头。**产出该改动的会话不能给自己评审。** 契约见
   [`docs/contributing/REVIEW_DISPATCH.md`](docs/contributing/REVIEW_DISPATCH.md)。
5. **合并后对账与回签**：实施会话逐项核对「自述 vs 实际」（`git status`、文件存在性、门禁原始输出），
   给行为类 issue 贴 `needs-live-verify`；由**独立上下文的回签会话**（维护者派发，或维护者本人复核）
   按 PR_GUIDE 的模板回签，**回签通过才关 issue**。**产出该改动的会话不能给自己回签。**

> 这个仓库的行为类改动大多要**浏览器里实际操作**才能验（水印渲染效果、词库持久化、
> 文件名生成、导入导出）。所以第 5 步不是形式主义：合并只代表代码进了 `master`，
> 不代表页面那头症状消失。

### 0.1 门禁清单只有一个事实来源

本地与 CI 跑同一份清单 [`scripts/gates.json`](scripts/gates.json)，执行器是
[`scripts/run_gates.py`](scripts/run_gates.py)：

```bash
python scripts/run_gates.py --list          # 看档位与执行顺序
python scripts/run_gates.py ci              # 全量（最便宜的一档，本机日常）
python scripts/run_gates.py ci --fail-fast  # 见到红就停
python scripts/run_gates.py ci --shard static
python scripts/run_gates.py ci --prepush    # pre-push 钩子口径：按 gates.json 的 prePush 标记取分片
python scripts/run_gates.py support         # 需要 PR 上下文的一档；本地无 PR 时 SKIP
```

- **新增门禁只改清单**，然后跑 `python scripts/check_gates_manifest.py --write` 重写下面这段；
  手改会被元门禁打红（磁盘脚本、清单、本节三者必须一致）。
- `core.hooksPath` 指向 `.githooks`：`commit-msg` 拦文案格式与 `Co-Authored-By:`，
  并调 `scripts/check_commit_messages.py` 扫 commit message 里的敏感值；
  `pre-push` 跑 static 分片。换机器后重设一次：`git config core.hooksPath .githooks`。
- `pre-push` 的 `SKIP_GATES=1` **仅用于钩子自身故障**（例如钩子在当前 shell 下跑不起来），
  它会打印醒目横幅但跳过 static 门禁。使用后必须在 PR 正文说明原因，并附上手动执行
  `python scripts/run_gates.py ci` 的原始输出；它不是「门禁红了赶时间」的通行证。
  绕过会写入 `$(git rev-parse --git-common-dir)/skip-gates.log`（所有 worktree 共用一份），用于事后审计。

<!-- gates:ci:begin -->
> 本节由 `python scripts/check_gates_manifest.py --write` 从 `scripts/gates.json` 生成，**不要手改**；
> 顺序即本机全量执行顺序。

| # | 分片 | 门禁 | 命令 | 防什么 |
|---|---|---|---|---|
| 1 | `static` | `check_gates_manifest.py` | `python scripts/check_gates_manifest.py` | 元门禁：scripts/gates.json、AGENTS.md 生成段、磁盘脚本三者零漂移；手改 AGENTS.md 的门禁表格即红。cmd 参数也不许降级：禁用参数表的唯一来源是 scripts/check_gates_manifest.py 的 FORBIDDEN_FLAGS（本清单不再枚举），flags.require 声明的参数必须在场，脚本 --help 不认的参数即红 |
| 2 | `static` | `_common.py` | `python scripts/_common.py` | 门禁共享层自检：`gate_hits` 新旧路径逐项等价、共享层自身命中门禁链、`GATE_TRIGGERS` 与 `FROZEN_GATE_TRIGGERS` 零漂移、退出码常量 0/1/2。各门禁的 `--self-test` 不覆盖共享层，必须由本档位显式执行 |
| 3 | `static` | `check_no_vendored.py` | `python scripts/check_no_vendored.py` | 第三方参考仓库 / 逆向还原的中间产物一个都不许被跟踪，且 .gitignore 的忽略规则必须还在；顺带拦下 >5 MB 的被跟踪文件（线上构建产物、抓包原始文件就是靠这条挡在外面的） |
| 4 | `static` | `check_doc_links.py` | `python scripts/check_doc_links.py` | 所有被跟踪 md 的相对链接必须可达。这套协作靠文档当记忆，断链等于记忆断了 |
| 5 | `static` | `check_line_refs.py` | `python scripts/check_line_refs.py` | 被跟踪文件（md/java/kt/kts/py，含代码注释）不许写物理行号（AGENTS.md §2 第 10 条）：行号随上方插行漂移，而文档与注释都没有编译门禁能发现。扩展名白名单避开主机端口与章节号；md 跳围栏代码块（issue/PR 模板里的行号示例属一次性上下文）与 docs/archive/ 冻结证据（失效是预期），代码类型不剥围栏；门禁自身的测试夹具按精确路径排除（夹具必须字面含违规形态才能验证判红），不做值级白名单；裸冒号数字误报不可控，不进这条门禁 |
| 6 | `static` | `py_compile` | `python -m compileall -q scripts` | scripts/ 下所有 Python 必须能编译。门禁脚本语法崩在 CI 里才发现代价最高 |
| 7 | `static` | `check_sensitive.py` | `python scripts/check_sensitive.py --check` | 敏感信息门禁：配对 GUID 及其 hex/14 位去横线/4-4-4-2 重分组/Base64/URL 编码、序列号、内网 IP、私人路径、私有仓库标识、通用密钥形态。命中即阻断。公开示例值走脚本内 ALLOWLIST，只按「类别 + 精确值」放行，不做网段/通配；其余行内豁免必须带具体理由。--fix 才改写，--warn 只用于排查基线 |

共 7 个 CI 门禁，分 1 个分片（static 7）；manual 0、support 3 见 `scripts/gates.json`。
<!-- gates:ci:end -->

### 0.2 证据与验证纪律

- **无证据不修复**：任何 finding 必须带可直接粘贴的 `文件:行号` 或可复现命令才进入修复；
  没有证据的视为虚构。
- **完成声明以磁盘为准**：任何「已完成」都要独立用 `git status`、文件存在性、门禁原始输出复核，
  不采信转述。
- **浏览器结论必须标注环境**：浏览器与版本 / 操作系统 / 数据状态（本地词库、`localStorage` 里有什么）。
  本项目的每一条结论都强依赖这些，缺了就无法复现。
- **红了先归因**：用 pristine HEAD 的 worktree 对照跑一遍，分清代码问题还是环境抖动，再动手。
- **独立性锚在会话，不在账号**：本仓库所有会话共用同一个 Git 账号（`ID-VerNe`），
  账号 / 分支 / PR 编号都不是独立性判据，GitHub 时间线上也看不出实施会话与评审 / 回签会话的区别。
  判据是**独立上下文**——产出该改动的会话不得给自己评审或回签，评审与回签各自来自独立上下文的会话；
  同一会话换个角色名不算。角色词一律按会话定义：**实施会话**（写 plan、改代码、开 PR 的那个会话）、
  **评审会话**（决定合不合）、**回签会话**（决定 issue 关不关）；**发现者**指维护者本人
  （通常由维护者操作或派发 Agent 执行）。为让 GitHub 时间线能追回会话，评审结论与回签里请写明
  会话句柄 `角色名@<8 位短 id>`（例如 `review-9c@315b439d`）——句柄里的短 id 是该会话
  transcript 文件名那串 16 位十六进制 id 的前 8 位（**不是**父会话 id），磁盘上对应
  `~/.claude/projects/<项目>/<父会话 id>/subagents/agent-a<角色名>-<16 位 id>.jsonl`，
  用 `find . -path "*subagents/agent-a<角色名>-<8 位短 id>*"` 即可定位，无需先知道父会话 id；
  **不要写完整 UUID**（形如 8-4-4-4-12 的父会话 id 会命中 `check_sensitive.py` 的 guid 规则判红，
  见 `scripts/check_sensitive.py` 的 `KNOWN_EXAMPLE_UUIDS` 附近注释）。
- **PR 正文与评论也在脱敏扫描范围内**：`support` 档的
  [`scripts/check_pr_body.py`](scripts/check_pr_body.py) 会扫 PR 正文与评论，
  且外部输入**不认行内豁免**；本机路径、内网地址、口令、序列号、配对 GUID 一律用
  `<本机用户路径>` / `<网关IP>` / `<PAIRED_GUID>` 这类占位。
  提交前可本地预检：`python scripts/check_pr_body.py --body-file <正文文件>`。

---

## 1. 项目身份

| 项 | 值 |
|---|---|
| 产品名 | 在线图片水印生成器（为照片批量添加统一的相机 / 镜头 / 地点水印） |
| 仓库 | `ID-VerNe/watermark-generator-web` |
| 目录名 | `watermark`（**与仓库名不一致，别被目录名误导**） |
| 技术栈 | React 19 + Vite + TypeScript + Tailwind CSS 4，纯前端、无服务端 |
| 包管理器 | npm（`node_modules/` 不入库） |
| 主开发线 | `master`（不再直接提交，见 §0） |
| 数据存储 | 全部 `localStorage`，无网络请求、无后端 |

## 2. 红线（违反任何一条都不算完成任务）

1. **不留红 commit**。改动完成即跑 `python scripts/run_gates.py ci`。
2. **不引入服务端 / 外部存储**。本项目数据全部本地处理（浏览器 Canvas + `localStorage`）；
   新增上传 / 外部存储 / 网络请求必须先进 issue 讨论并把结论落进该 issue，不在 PR 里顺手加。
3. **大文件不进版本控制**。线上构建产物、字体、逆向还原的中间产物一律 gitignore。
   由 `check_no_vendored.py` 兜底（>5 MB 的被跟踪文件即红）。
4. **逆向还原中间产物不入库**。`restored/`、`rea-analysis.json`、`dist/` 只留本地，
   `git ls-files` 里出现即红。
5. **逐个 `git add <file>`**，禁止 `git add .` / `-A` / 目录批量。
6. **禁止 `Co-Authored-By:` 行**，`.githooks/commit-msg` 会直接拦。
7. **不在主工作区切分支**，用 `git worktree`；用完 `git worktree remove --force`。
8. **不新建仓库内 `CLAUDE.md`**（本文件是唯一协作说明）。
9. **测试方法论（先写测试，后改代码）**：
   - 先写用例 → 故意改坏关键逻辑（**变异**）验证用例能抓到 → 还原 → 才准动实现；
   - **变异必须替换断言瞄准的子串**，在前面加无意义前缀是无效变异；
   - 变异还原**不许用 `git checkout --`**：对未提交的跟踪文件 checkout 会把本轮全部改动
     冲回 HEAD，而 `git diff --stat` 还显示为空、看不出异常。协议是
     `cp file /tmp/x.bak` → 变异 → `cp` 回写。
10. **不写物理行号**（全仓规则，`check_line_refs.py` 兜底）：被跟踪文件
    （`.md` / `.ts` / `.tsx` / `.py`，含 README 类与代码注释）**不得**用
    「文件名 / 扩展名 + 冒号 + 数字」引用代码或文档位置。引用一律写「文件名 +
    该文件里可唯一 `grep` 的字符串」或「类名 + 方法名」；引用规范条目用编号（`V-16` / `C-08`），
    引用实测数据用章节号 + 数值。锚点串必须能在目标文件里 `grep` 到且能唯一定位，串被改名时
    改锚点而不是退回写行号。例外：`docs/archive/` 是当时证据的冻结副本，不改；issue / PR
    正文属一次性上下文，可写行号，但要绑定当时的分支或 commit。不带文件名的裸冒号数字
    进不了门禁（与时刻、编号无法区分），靠评审把关。

## 3. 现状与单一归属

### 单一归属（新代码往哪儿写）

| 关注点 | 唯一归属 |
|---|---|
| 门禁清单 / 执行器 | `scripts/gates.json` + `scripts/run_gates.py`（**不要在别处再写一份命令数组**） |
| 迭代流程细则 | `docs/contributing/ISSUE_GUIDE.md` / `docs/contributing/PR_GUIDE.md` |
| 合并评审（派发 + 评审清单） | `docs/contributing/REVIEW_DISPATCH.md`（派发文案用 `scripts/review_prompt.py` 生成，**不要手写**） |
| 水印绘制 | `src/utils/watermark.ts`（canvas 4000×764 输出） |
| 表单与数据管理 | `src/components/WatermarkForm.tsx` + `src/data/defaults.ts` |
| localStorage 读写 | `src/utils/storage.ts`（带容错） |
| 字体 / 图片加载 | `src/utils/assets.ts` |
| 文件名净化 | `src/utils/filename.ts` |

### 事实类型 → 唯一权威（冲突时先看这张表）

「单一归属」回答「新代码往哪儿写」，下表回答「同一件事的**说法**听谁的」。别处复述时只给摘要 + 链接；
单说「唯一事实源」时必须带作用域（如「协作规则的唯一事实源」「门禁清单的唯一事实源」），
**不许无限定地指代整份 `AGENTS.md`**。

| 事实类型 | 唯一权威 | 别处怎么引 |
|---|---|---|
| 协作规则、红线、五步流程入口 | `AGENTS.md` §0 / §2 | `CONTRIBUTING.md` 只给对外最小版 |
| 流程细则（issue / PR / 评审） | `docs/contributing/ISSUE_GUIDE.md`、`PR_GUIDE.md`、`REVIEW_DISPATCH.md` | `AGENTS.md` 只给入口与硬规则 |
| 门禁清单、档位与条数 | `scripts/gates.json`（§0.1 生成段由它渲染） | 文档里**不写条数**，只给指针 |
| 钩子安装、绕过与审计 | `AGENTS.md` §0.1 | — |
| 文档与代码注释里引用坐标的写法 | `AGENTS.md` §2 第 10 条 | 门禁是 `scripts/check_line_refs.py` |
| 合并评审的派发与检查项 | `docs/contributing/REVIEW_DISPATCH.md`（文案由 `scripts/review_prompt.py` 生成） | 不要手写派发文案 |
| 自动关单事故的完整叙述 | `docs/contributing/PR_GUIDE.md` 的「硬规则」节 | `REVIEW_DISPATCH` 只留检查项 + 指针 |

## 4. 环境坑（每个都真实踩过）

- **`npm run dev` 默认挂在 `http://localhost:5173/generator/`**：`vite.config.ts` 里
  `base: "/generator/"`。直接开 `localhost:5173` 会 404。
- **`localStorage` 的键名前缀**：`watermarkInputs` / `dataLibraries` / `locationHistory` /
  `filenameConfig`。改键名会丢用户已有数据，属于行为变更，必须走 issue。
- **`npm install` 后 `node_modules` 不入库**：`.gitignore` 已挡；`git add .` 仍可能把
  `package-lock.json` 之外的无关文件吸进来，坚持逐个 add。
- **字体是 `public/misans.ttf`**：改字体文件体积大，走 `check_no_vendored` 的 5 MB 红线时
  注意它是否超限；字体是构建产物，改动要同时看水印渲染效果。
- **水印输出是 4000×764 PNG**：预览与下载共用同一绘制函数，改绘制逻辑必须两种出口都验。
- **Windows 下 `LF will be replaced by CRLF` 警告属正常**（`autocrlf`）；仓库内存的是 LF。

## 5. Commit 与发布

### Commit message

- 格式 `type(scope): 中文摘要（issue #NN）` + 正文。
  **三处带 issue 号**：分支名、PR 标题、commit。
- 正文说清**为什么这么改**与**实测数字**，不要只列改了哪些文件。
- `type` 取 `feat` / `fix` / `docs` / `refactor` / `chore` / `test` / `perf`。
- 一个 PR 允许多个 commit，但每个 commit 自解释，不写 `wip` / `fix`。
- 提交前跑 `python scripts/run_gates.py ci`，push 前确认 `git status` 干净。

### 发布

本仓库暂不发版（无发布管道）。产物经 `npm run build` 出到 `dist/`（不入库），
部署到线上 `watermark.likesyou.org/generator` 的流程在仓库之外。

## 6. 文档索引

| 文件 | 内容 |
|---|---|
| `README.md` | 对外门面：功能、快速开始、项目结构、数据持久化 |
| `CONTRIBUTING.md` | 外部贡献入口：项目是什么、环境要求、门禁怎么跑；规则冲突以 AGENTS.md 为准 |
| `LICENSE` | MIT 许可证 |
| `docs/contributing/ISSUE_GUIDE.md` | 怎么发 issue：正文四要素、复现命令与 `needs-repro`、关闭方式、模板 |
| `docs/contributing/PR_GUIDE.md` | 怎么开 PR：拆分命名、正文分段、基线验证、门禁改动、合并条件、对账与回签 |
| `docs/contributing/REVIEW_DISPATCH.md` | 合并评审契约：派发方式、评审者必做清单、结论格式、常见误判 |
| `scripts/review_prompt.py` | 生成合并评审的派发文案（默认不含 PR 正文，`--self-test` 自检） |
| `scripts/check_pr_sections.py` | PR 正文分段结构校验（`support` 档，CI 在 `pull_request` 上跑） |
| `scripts/check_pr_body.py` | PR 正文与评论的敏感信息校验：复用 `check_sensitive.py` 的规则，不认行内豁免（`support` 档，评论走 gh） |
| `scripts/check_commit_messages.py` | commit message 的敏感信息门禁：`support` 档扫 PR 的 `base..head` 新增提交，本地 `.githooks/commit-msg` 调 `--message-file` 先拦 |
| `scripts/gates.json` | 门禁清单**唯一事实来源**（§0.1 生成段由它渲染） |
| `scripts/check_gates_manifest.py` | 元门禁：清单 / AGENTS.md 生成段 / 磁盘脚本零漂移；cmd 参数不许降级（`--self-test` 跑回归用例） |
| `scripts/check_line_refs.py` | 全仓被跟踪文件物理行号禁令的门禁（规则在 `AGENTS.md` §2 第 10 条） |
| `scripts/check_sensitive.py` | 敏感信息门禁（`ci` 档 static 分片）：GUID / 序列号 / 内网 IP / 私人路径 / 私有仓库标识 / 密钥形态 |
| `scripts/check_no_vendored.py` | 中间产物不入库 + 无 >5 MB 大文件（`ci` 档 static 分片） |
| `scripts/check_doc_links.py` | 被跟踪 md 的相对链接可达 + `AGENTS.md` §6 索引表反向校验（`ci` 档 static 分片） |
| `scripts/_common.py` | 门禁共享层：子进程 / `gh` JSON / `git ls-files -z` / 门禁链判定 / 退出码常量 |
| `scripts/run_gates.py` | 门禁执行器（读 `gates.json` 跑档位） |
| `scripts/resolve_python.sh` | 门禁链上 Python 解释器的唯一解析（钩子用） |
| `.githooks/commit-msg` | 提交信息格式与敏感值检查钩子 |
| `.githooks/pre-push` | push 前跑 static 分片门禁（`SKIP_GATES=1` 会留审计日志） |
| `.github/workflows/ci.yml` | CI：同一份 `gates.json`，`pull_request` 上跑 support 档 |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bug 报告模板（四要素） |
| `.github/ISSUE_TEMPLATE/feature_request.md` | 功能建议模板 |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR 正文模板（分段齐全） |
| `package.json` | 依赖与脚本（`dev` / `build` / `preview`） |

## 7. 工作习惯

- 改前先读相关文件的现状与注释——本仓库注释密度高，多数「为什么」都写在代码旁边。
- 前端改动先 `npm run build` 或 `npm run dev` 手验一次，再进 PR；行为类改动要在 PR 的
  「测试」段贴实际渲染 / 输出的原始证据，不只写「都过了」。
- 词库与本地数据相关改动，验证时用一份最小词库，别污染真实使用场景的数据。