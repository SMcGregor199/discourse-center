# Discourse Center Editor

A small production-quality rich text editor built with React + TypeScript + Vite and Tiptap v3.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Features

- Notion-ish editor layout with a readable content column
- Toolbar with active states for common formatting commands
- Contextual bubble menu (Bold, Italic, Link, Unlink)
- Floating `+` menu on empty lines (H2, Bullet List, Blockquote)
- Debounced persistence to `localStorage` (JSON document)
- Restore saved content on load
- Clipboard actions: Copy HTML, Copy JSON, Clear
- Character and word counts in footer
- Keyboard-accessible controls with visible focus outlines
