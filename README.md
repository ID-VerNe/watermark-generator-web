# Web Watermark Generator

基于 **React 19 + Vite + Tailwind CSS 4** 的在线图片水印生成器。为照片批量添加统一的相机 / 镜头 / 地点水印。

> 本仓库源码由线上构建产物（`watermark.likesyou.org/generator`）逆向还原，功能与线上版本逐项验证一致。

## ✨ 功能

- **水印字段**：City、Location / District、Camera、Lens，支持自动补全（Autocomplete）
- **Canvas 渲染**：`SHOT ON <相机> & <镜头>` 右下角、签名 Logo、位置文字 + 位置图标、自定义左 Logo
- **自定义字体**：内置 Misans 字体，通过 `FontFace` 注册为 `CustomWatermarkFont`
- **自定义左 Logo**：本地上传图片，可调宽度，可随时移除
- **位置显示开关**：一键隐藏 / 显示左下角位置文字与图标
- **文件名定制**：勾选哪些字段参与生成文件名，非法字符自动替换为 `_`
- **数据管理**：城市 / 位置 / 相机 / 镜头词库支持导出 `.json` 与导入 `.json`
- **智能记忆**：
  - 输入值、词库、每个城市最近使用的位置、文件名配置自动持久化到 `localStorage`
  - 下载水印时自动把新录入的城市 / 相机 / 镜头写回词库
  - 切换城市时自动记忆并恢复上次使用的位置
- **实时预览**：表单每次变更立即重新渲染 4000×764 的 canvas 预览

## 🖼 效果

生成的水印输出为 **4000 × 764** PNG，画布布局：

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│                                    [签名 Logo]            │
│  [自定义左Logo]   [📍 广州 · 黄埔]        SHOT ON LICE-7C  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式（默认 http://localhost:5173/generator/）
npm run dev

# 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

## 🗂 项目结构

```
watermark/
├── index.html               # 入口 HTML
├── vite.config.ts           # Vite 配置（base: /generator/）
├── src/
│   ├── main.tsx             # 挂载入口
│   ├── App.tsx              # 主组件：状态管理 + 预览 + 下载
│   ├── types.ts             # TypeScript 类型定义
│   ├── data/defaults.ts     # 默认输入 / 词库 / 文件名配置
│   ├── components/
│   │   ├── WatermarkForm.tsx     # 主表单 + 数据管理弹窗
│   │   ├── AutocompleteInput.tsx # 自动补全输入框
│   │   └── PreviewCanvas.tsx     # canvas 预览 + 生成中/错误遮罩
│   └── utils/
│       ├── watermark.ts     # canvas 水印绘制（4000×764）
│       ├── assets.ts        # 字体 / 图片加载
│       ├── storage.ts       # localStorage 读写（带容错）
│       └── filename.ts      # 文件名净化
└── public/
    ├── misans.ttf           # 水印字体
    ├── location_logo.png    # 位置图标
    ├── signature_logo.png   # 签名 Logo
    └── logo.png             # 站点图标
```

## 💾 数据持久化

状态保存在 `localStorage`，键名如下：

| 键名 | 内容 |
|------|------|
| `watermarkInputs` | 表单输入（城市 / 位置 / 相机 / 镜头 / 字号 / Logo 宽度 / 显示位置） |
| `dataLibraries` | 城市 / 位置 / 相机 / 镜头 词库 |
| `locationHistory` | 每个城市最近使用的位置 |
| `filenameConfig` | 文件名参与字段勾选 |

## 📜 License

[MIT](LICENSE)

Copyright (c) 2026 ID-VerNe