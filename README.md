# micro-apps

一些自用小工具 / 小应用合集，每个项目独立一个文件夹，解决特定的小问题。

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

## 新增项目规范

每加一个小项目：
1. 在根目录新建独立文件夹
2. 放入项目文件
3. 在本 README 的「项目列表」中追加一条说明
