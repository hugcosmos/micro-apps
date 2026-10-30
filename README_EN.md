# micro-apps

English | [中文](./README.md)

A collection of small, self-use utilities and apps. Each project lives in its own folder, built to solve one specific problem.

All projects are licensed under the [MIT License](./LICENSE).

---

## Projects

### [kindle-sync](./kindle-sync)

**LAN eBook Sync Server for Old Kindle Devices**

A lightweight Flask web server that lets old Kindle devices download eBooks directly through their built-in browser over the local network — no USB cable or push service required.

Supported formats: mobi, epub, azw3, pdf, txt.

- Single-file script, zero config
- Auto-scans books directory and renders a web list
- Chunked transfer for large files
- Auto-detects LAN IP address

**Quick start:**
```bash
cd kindle-sync
pip install flask
python kindle_server.py
```

