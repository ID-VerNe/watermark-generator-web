#!/usr/bin/env python3
"""守住「中间产物 / 参考文件不进版本控制」这条约定。

本项目源码由线上构建产物逆向还原而来：反编译中间产物（`restored/`）、分析文件
（`rea-analysis.json`）、构建产物（`dist/`）都只留本地，不随本项目分发。
`git add` 时一个手滑（`git add .`）就会把它们吸进来，而 .gitignore 挡不住显式 add。

这条门禁同时盯三件事：
1. 中间产物目录名一个都不在 `git ls-files` 里；
2. 每个名字都在 `.gitignore` 里有一条规则（防止有人删掉忽略项）；
3. 没有被跟踪的大文件（> 5 MB）—— 线上构建产物 / 字体 / 抓包原始文件就是靠这条挡在外面的。
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from _common import ENV_FAIL, EnvProblem, git_ls_files

ROOT = Path(__file__).resolve().parent.parent

# 只留本地、不入库的目录 / 文件（精确匹配目录名前缀）。
VENDORED = [
    "restored",
    "rea-analysis.json",
    "dist",
]

MAX_BYTES = 5 * 1024 * 1024

# 超过 MAX_BYTES 但必须入库的文件，集中登记并写具体理由；不在表里的超限文件照样红。
# 加条目必须在 AGENTS.md §2 第 3 条同步留痕，两条一起改。
ALLOWED_LARGE_FILES: tuple[tuple[str, str], ...] = (
    (
        "public/misans.ttf",
        "内置思源黑体变体字体：水印渲染缺它整页字体回退，7.6 MB 未压缩，属产品资源而非构建产物",
    ),
)


def _is_allowed_large(rel: str) -> bool:
    return rel in {path for path, _ in ALLOWED_LARGE_FILES}


def tracked_files() -> list[str]:
    """被跟踪文件清单；`-z` 与失败语义统一由 `_common.git_ls_files` 负责（#204）。"""
    return git_ls_files()


def main() -> int:
    problems: list[str] = []
    try:
        files = tracked_files()
    except EnvProblem as exc:
        print(f"[红] {exc}", file=sys.stderr)
        return ENV_FAIL

    for name in VENDORED:
        hits = [f for f in files if f == name or f.startswith(name + "/")]
        if hits:
            problems.append(f"中间产物被跟踪了：{name}（{len(hits)} 个文件）")

    ignore = (ROOT / ".gitignore").read_text(encoding="utf-8") if (ROOT / ".gitignore").is_file() else ""
    for name in VENDORED:
        if f"/{name}/" not in ignore and not any(line.strip().startswith(name) for line in ignore.splitlines()):
            problems.append(f".gitignore 缺少对 `{name}` 的忽略规则")

    for rel in files:
        p = ROOT / rel
        try:
            size = p.stat().st_size
        except OSError as e:
            # 被跟踪文件却读不到，说明索引与磁盘已经脱节；静默跳过会让门禁假绿（#203）。
            problems.append(f"被跟踪文件读不到：{rel}（{e.strerror or '未知错误'}）")
            continue
        if size > MAX_BYTES and not _is_allowed_large(rel):
            problems.append(
                f"被跟踪的大文件：{rel}（{size / 1048576:.1f} MB，上限 5 MB）"
            )

    if problems:
        for p in problems:
            print(f"[红] {p}", file=sys.stderr)
        return 1

    print(f"[绿] 已跟踪 {len(files)} 个文件：无中间产物、忽略规则齐全、无超 5 MB 的大文件")
    return 0


def _cli() -> argparse.Namespace:
    """声明参数，让元门禁的 `--help` 自证层覆盖本脚本（#203）。

    本脚本没有可选开关；加 argparse 的唯一目的是让拼错参数变成 `exit 2`，
    而不是被 `main()` 静默忽略后照常跑绿。
    """
    ap = argparse.ArgumentParser(description="守住中间产物不进版本控制")
    return ap.parse_args()


if __name__ == "__main__":
    _cli()
    sys.exit(main())