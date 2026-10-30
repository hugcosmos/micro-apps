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

---

### [Universal-Video-Subtitle-Mask](./Universal-Video-Subtitle-Mask)

**Universal Video Subtitle Mask (Chrome Extension)**

A zero-permission Chrome extension that masks burned-in (hardcoded) subtitles inside the video frame — for example, hiding the Chinese subtitle while learning English so you rely purely on listening; also handy for covering any fixed text on screen.

- Manifest V3, zero permissions, zero dependencies, all code runs locally
- Works on Bilibili, YouTube, Netflix, TED, Coursera
- Draggable mask with 3-direction resizing (right / bottom / corner); double-click it to open a control bar (width / height / opacity / center)
- 4 built-in themes (Galaxy Purple / Pastel Rainbow / Matte Black / Frosted Slate) + custom color picker
- Floating control pill on the right edge: toggle mask, cycle themes, pick color, switch UI language (EN / 中文), collapse into screen edge
- Shortcuts: `C` cycle theme · `Alt+H` / `Ctrl+Shift+H` collapse pill · `Alt+[` / `Alt+]` width · `Alt+-` / `Alt+=` height · `Alt+0` center · `Alt+M` / `Ctrl+Shift+X` show/hide mask
- Auto-adapts to fullscreen and window resizing

**Install:**
```bash
# Open chrome://extensions in your browser
# Enable "Developer mode" → "Load unpacked" → select the Universal-Video-Subtitle-Mask folder
```

Full usage guide: [USAGE_EN.md](./Universal-Video-Subtitle-Mask/USAGE_EN.md) · [USAGE.md（中文）](./Universal-Video-Subtitle-Mask/USAGE.md)

