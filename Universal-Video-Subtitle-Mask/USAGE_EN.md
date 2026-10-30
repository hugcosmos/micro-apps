# Universal Video Subtitle Mask — Usage Guide

A zero-permission Chrome extension that masks burned-in (hardcoded) subtitles inside the video frame.

Typical use cases:

- **English learning**: cover the Chinese subtitle so you rely purely on listening
- **Foreign films**: hide translated subtitles so your eyes aren't pulled away from the picture
- Any scenario where you want to cover fixed text on screen

## Supported Sites

Bilibili, YouTube, Netflix, TED, Coursera. To add or remove sites, edit `matches` under `content_scripts` in `manifest.json`.

## Install

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Open a supported site and play a video — the mask appears automatically (it mounts once a `<video>` element is detected)

## Usage

- **Drag** the mask to move it; resize it in three directions via the right / bottom / corner handles
- **Double-click** the mask to open the control bar: width, height, opacity, center horizontally
- Floating **pill** on the right edge: ⊘ toggle mask · 🎨 cycle theme · color picker for a custom color · UI language (EN / 中文) · ❯ collapse into the screen edge (hover to temporarily slide it out)
- The mask appears near the bottom of the viewport (~84% height) by default; drag it anywhere to line up with your subtitles

## Shortcuts

| Shortcut | Action |
| --- | --- |
| `C` | Cycle theme |
| `Alt+H` / `Ctrl+Shift+H` | Collapse / expand pill |
| `Alt+[` / `Alt+]` | Narrow / widen |
| `Alt+-` / `Alt+=` | Shorten / heighten |
| `Alt+0` | Center horizontally |
| `Alt+M` / `Ctrl+Shift+X` | Show / hide mask |

> Shortcuts are disabled while an input field or textarea is focused, to avoid accidental triggers.

## Notes

- Manifest V3, no permissions required, all code runs locally
- The UI language preference is remembered (localStorage); mask position / size / theme / opacity are not persisted and reset after a page refresh
