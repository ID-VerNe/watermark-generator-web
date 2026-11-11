#!/usr/bin/env python3
"""类型检查门禁：把 `tsc --noEmit` 纳入门禁链（issue #11）。

背景：`package.json` 的 `build` 是 `vite build`（esbuild），转译不做类型检查，
所以「类型契约与运行时不符」这类缺陷（如 issue #3 的 `fontUrl`）在合入前不可见。
本门禁把它挡在合入前。

为什么需要这层包装，而不是把 `tsc` 直接写进 `scripts/gates.json`：

1. **`--noEmit` 写不进清单**：元门禁 `check_gates_manifest.py` 的 `FLAG_TOKEN`
   只认小写长参数（`--[a-z][a-z0-9-]*`），`--noEmit` 的大写 E 会被判「参数形态不对」。
   把参数封进本脚本，清单里只写 `python scripts/check_typescript.py`。
2. **退出码语义要对齐**：`tsc` 自己的约定是 `0` 通过 / `1` 配置错 / `2` 类型错。
   若直接透传，类型错会变成 `2`——而本仓库把 `2` 定义为「环境问题、这次没做成」。
   所以这里把「node 或 typescript 缺失」判为环境问题退 2，其余非零一律按内容红退 1。
3. **依赖缺失要显式退 2**：新克隆未 `npm install` 时，`node` 会因找不到模块而退 1，
   那会被读成「类型不合格」。这里先探测 `node_modules/typescript` 是否存在，缺则退 2。
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from _common import CONTENT_FAIL, ENV_FAIL, OK, EnvProblem, run

ROOT = Path(__file__).resolve().parent.parent

# 依赖安装目录与被调用的入口（`node_modules/.bin/tsc` 是 shell 脚本，
# 在「不带 shell 的子进程」下 Windows 上起不来，故直接用 node 跑 bin 的 JS）。
NODE_MODULES = ROOT / "node_modules"
TSC_ENTRY = NODE_MODULES / "typescript" / "bin" / "tsc"


def locate_tsc(node_modules: Path = NODE_MODULES) -> Path | None:
    """在给定依赖目录下找 TypeScript 入口；找不到返回 None（调用方判为环境问题）。"""
    entry = node_modules / "typescript" / "bin" / "tsc"
    return entry if entry.is_file() else None


def locate_node() -> str | None:
    """找 node 可执行文件；PATH 上没有返回 None（调用方判为环境问题）。"""
    return shutil.which("node")


def run_tsc(project: Path | None = None, *, node: str | None = None,
            entry: Path | None = None, runner=None) -> tuple[int, str]:
    """跑一次 `tsc --noEmit`；返回 (退出码, 合并后的输出)。

    `project` 为 None 时用仓库根的 `tsconfig.json`（门禁的正常路径）；
    自检传临时工程目录。环境问题抛 `EnvProblem`，由调用方映射成退 2。
    """
    node = node or locate_node()
    entry = entry or locate_tsc()
    if not node:
        raise EnvProblem("找不到 node（类型检查需要 Node.js）")
    if not entry:
        raise EnvProblem(
            f"未安装类型检查依赖：{TSC_ENTRY.relative_to(ROOT)} 不存在，请先在仓库根跑 `npm install`"
        )
    argv = [node, str(entry), "--noEmit"]
    if project is not None:
        argv += ["--project", str(project)]
    proc = run(argv, runner=runner)
    return proc.returncode, ((proc.stdout or "") + (proc.stderr or "")).strip()


def main() -> int:
    try:
        rc, out = run_tsc()
    except EnvProblem as exc:
        print(f"[红] {exc}", file=sys.stderr)
        return ENV_FAIL

    if rc != 0:
        # 已经确认 node 与 tsc 都在，非零即内容问题（类型错 / tsconfig 坏），退 1。
        for line in out.splitlines():
            print(f"[红] {line}", file=sys.stderr)
        print("[红] tsc --noEmit 报错，见上方输出", file=sys.stderr)
        return CONTENT_FAIL

    if out:
        # tsc 偶有非错误输出（如 --noEmit 下的提示）；照实打印，不吞。
        for line in out.splitlines():
            print(f"    {line}")
    print("[绿] tsc --noEmit 无类型错误")
    return OK


def _cli() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="类型检查门禁（tsc --noEmit）")
    ap.add_argument("--self-test", action="store_true", help="跑内置回归用例（真调一次 tsc）")
    return ap.parse_args()


def self_test() -> int:
    """真跑 tsc 的墓碑：缺依赖必退 2、类型错必判红、干净必绿。

    这些用例在实现之前就写好（AGENTS.md §2 第 9 条）：把 `locate_tsc` 改成恒返回
    存在的路径，或在 `main()` 里把非零一律当绿，对应用例必须变红。
    """
    import tempfile

    checks: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        checks.append((name, ok, detail))

    # 1. 依赖目录里没有 typescript 时，locate_tsc 必须返回 None（环境问题分支可达）。
    with tempfile.TemporaryDirectory() as d:
        empty = Path(d)
        check("缺 typescript 时 locate_tsc 返回 None", locate_tsc(empty) is None)

    # 2. 有入口文件时必须认出来。
    with tempfile.TemporaryDirectory() as d:
        fake = Path(d) / "typescript" / "bin"
        fake.mkdir(parents=True)
        (fake / "tsc").write_text("// stub\n", encoding="utf-8")
        check("有 typescript 入口时 locate_tsc 认出来", locate_tsc(Path(d)) == fake / "tsc")

    # 3. 真跑：一个含类型错误的临时工程必须非零。
    with tempfile.TemporaryDirectory() as d:
        proj = Path(d)
        (proj / "src").mkdir()
        (proj / "tsconfig.json").write_text(
            '{"compilerOptions":{"noEmit":true,"strict":true,"skipLibCheck":true,'
            '"module":"ESNext","moduleResolution":"bundler","lib":["ES2022","DOM"]},'
            '"include":["src"]}',
            encoding="utf-8",
        )
        (proj / "src" / "bad.ts").write_text('const n: number = "s";\n', encoding="utf-8")
        try:
            rc_bad, out_bad = run_tsc(proj)
            check("含类型错误的工程 tsc 判红", rc_bad != 0, f"退出码 {rc_bad}")
        except EnvProblem as exc:
            check("含类型错误的工程 tsc 判红", False, f"环境问题：{exc}")
            out_bad = ""

        # 4. 同一工程改干净后必须通过。
        (proj / "src" / "bad.ts").write_text("const n: number = 1;\n", encoding="utf-8")
        try:
            rc_ok, out_ok = run_tsc(proj)
            check("干净的工程 tsc 通过", rc_ok == 0, f"退出码 {rc_ok}｜{out_ok[:80]}")
        except EnvProblem as exc:
            check("干净的工程 tsc 通过", False, f"环境问题：{exc}")

    # 5. main() 的退出码映射：类型错 -> 内容红(1)；干净 -> 绿(0)；环境问题 -> 环境红(2)。
    #    直接替换模块里的 run_tsc，验证 main() 的分支，而不是只断言常量。
    def with_fake(behavior):
        real = globals()["run_tsc"]

        def fake():
            return behavior()

        globals()["run_tsc"] = fake
        try:
            import contextlib
            import io
            with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
                return main()
        finally:
            globals()["run_tsc"] = real

    def raise_env():
        raise EnvProblem("模拟：缺依赖")

    import contextlib
    import io
    with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
        rc_content = with_fake(lambda: (2, "err"))   # tsc 类型错
        rc_green = with_fake(lambda: (0, ""))        # 干净
        rc_env = with_fake(raise_env)                # 环境问题
    check("main(): 类型错 -> 内容红(1)", rc_content == CONTENT_FAIL, f"实际 {rc_content}")
    check("main(): 干净 -> 绿(0)", rc_green == OK, f"实际 {rc_green}")
    check("main(): 环境问题 -> 环境红(2)", rc_env == ENV_FAIL, f"实际 {rc_env}")

    for name, ok, detail in checks:
        flag = "PASS" if ok else "FAIL"
        print(f"[{flag}] {name}" + (f"  — {detail}" if detail and not ok else ""))

    bad = [c for c in checks if not c[1]]
    if bad:
        print(f"== 自检红 {len(bad)} 项 ==", file=sys.stderr)
        return ENV_FAIL
    print(f"== 自检全绿：{len(checks)} 项 ==")
    return OK


if __name__ == "__main__":
    args = _cli()
    sys.exit(self_test() if args.self_test else main())
