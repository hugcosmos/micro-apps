# micro-apps

[English](./README_EN.md) | 中文

一些自用小工具 / 小应用合集，每个项目独立一个文件夹，解决特定的小问题。

所有项目均采用 [MIT License](./LICENSE) 开源协议。

---

## 项目列表

### [kindle-sync](./kindle-sync)

**老 Kindle 局域网电子书同步服务器**

用 Flask 起一个本地网页服务，老 Kindle 通过自带浏览器访问局域网地址，直接下载 mobi / epub / azw3 / pdf / txt 电子书，无需数据线推送。

- 单文件脚本，零配置
- 自动扫描书籍目录，生成网页列表
- 分块传输，支持大文件
- 自动识别局域网 IP

**快速开始：**
```bash
cd kindle-sync
pip install flask
python kindle_server.py
```

---

### [Universal-Video-Subtitle-Mask](./Universal-Video-Subtitle-Mask)

**通用视频字幕遮罩（Chrome 扩展）**

用于遮挡视频画面中「烤入」（硬编码）字幕的 Chrome 扩展，例如英语学习时盖住中文字幕、只靠听力理解内容；也适用于任何想遮住画面内固定文字的场景。

- Manifest V3，零权限、零依赖，全部代码本地运行
- 支持 Bilibili、YouTube、Netflix、TED、Coursera
- 可拖拽、三向缩放（右 / 下 / 右下角）的遮罩条，双击弹出调节条（宽 / 高 / 透明度 / 居中）
- 4 套预设主题（星空紫 / 柔和彩虹 / 纯黑哑光 / 磨砂深灰）+ 自定义取色
- 右侧悬浮控制胶囊：一键开关、切换主题、取色、中 / 英界面切换，可收纳入屏幕边缘
- 快捷键：`C` 切换主题 · `Alt+H` / `Ctrl+Shift+H` 收起胶囊 · `Alt+[` / `Alt+]` 调宽 · `Alt+-` / `Alt+=` 调高 · `Alt+0` 水平居中 · `Alt+M` / `Ctrl+Shift+X` 显隐遮罩
- 全屏与窗口变化自动适配

**安装：**
```bash
# 浏览器打开 chrome://extensions
# 开启「开发者模式」→「加载已解压的扩展程序」→ 选择 Universal-Video-Subtitle-Mask 文件夹
```

