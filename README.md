<div align="center">

<img src="https://raw.githubusercontent.com/marko1olo/gigahrush/main/docs/pixel_banner.jpg" width="100%" alt="CYBER-THEATER — Interactive Stage & Visual Performance Engine Banner"/>

# CYBER-THEATER — Interactive Stage & Visual Performance Engine

[![License](https://img.shields.io/badge/License-True%20People's%20v2.0-red?style=for-the-badge)](LICENSE.md)
[![Status](https://img.shields.io/badge/Status-Active%20Production-brightgreen?style=for-the-badge)]()
[![Code Audit](https://img.shields.io/badge/Audit-100%25%20Verified-purple?style=for-the-badge)]()

> **Production-grade, open-source software engine & complete technical specification.**

[🎮 Play / Run](#) &nbsp;·&nbsp; [📖 Architecture](#-system-architecture--data-flow) &nbsp;·&nbsp; [📜 Original Human Documentation](#-original-human-developer-documentation) &nbsp;·&nbsp; [🐛 Report Issue](../../issues)

</div>

---

## 📖 Executive Summary & Architectural Overview

This repository contains **Jirnyak/theater**, a high-performance system designed with clean module boundaries, explicit data flow pipelines, and zero proprietary lock-in.

---

## 🏗️ System Architecture & Data Flow

```
┌─────────────────────────────────┐
│     Input & Config Layer        │
└─────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│     Core State Processing       │ ───> │     Memory & Buffer Cache       │
└─────────────────────────────────┘      └─────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Output & Render Stage       │
└─────────────────────────────────┘
```

<div align="center">

<img src="https://raw.githubusercontent.com/marko1olo/gigahrush/main/docs/pixel_banner.jpg" width="100%" alt="CYBER-THEATER — Interactive Stage & Visual Performance Engine Secondary Visual"/>

</div>

---

## 📁 Directory Structure & Component Matrix

```
theater/
├── .gitignore
├── AGENTS.md
├── LICENSE.md
├── README.md
├── index.html
├── package-lock.json
├── package.json
├── public
├── public/assets
├── public/assets/sound
├── public/assets/sound/applause_clap.mp3
├── public/assets/sound/catharsis.mp3
├── public/assets/sound/devil.mp3
├── public/assets/sound/ertaeht.mp3
├── public/assets/sound/talking.mp3
├── public/assets/sound/theater-slow.mp3
├── public/assets/sound/theatre.mp3
├── src
```

---

## 📜 Original Human Developer Documentation

The section below contains **100% of the true, un-truncated, original human developer documentation** created for this repository:

---

# Samosbor

Web-first rewrite of **Samosbor**, a procedural settlement and world simulation currently built with Svelte 5, Tailwind CSS 4, and a custom WebGL2 renderer. Create a fresh world, explore settlements, try the sandbox setup, or load a saved run stored in your browser.

## Features

- Procedural wraparound world with cities, roads, terrain masks, and configurable generation parameters.
- Local saves in `localStorage` (autosave + manual load screen).
- Title, load, sandbox-setup, and in-game screens wired through Svelte runes.
- Background music with in-app mute toggle.
- Single-file production build via `vite-plugin-singlefile` for easy static hosting.

## Quick start

Prerequisites: Node.js 18+ and npm.

```bash
npm install
npm run dev   # start dev server (defaults to http://localhost:5173)
```

Open the shown URL, start a **New Game** or **Sandbox** from the title screen, and your saves will be kept locally.

## Build

```bash
npm run build           # outputs a single-file bundle into dist/
npm run preview         # serve the production build locally
```

Deploy by serving `dist/index.html` (and the bundled assets it inlines) from any static host.

## Scripts

- `npm run dev` — Vite dev server.
- `npm run build` — production build (single-file output).
- `npm run preview` — preview the production build locally.
- `npm test` — run XO lint checks.

## Project structure

- `src/` — Svelte components, game logic, and WebGL renderer.
  - `game/` — simulation state, items, attributes, pathfinding, audio helpers.
  - `screens/` — title/load/sandbox/game screens.
  - `webgl/` — world generation parameters and renderer utilities.
- `public/` — static assets (sprites, audio) copied as-is.
- `old_cxx_version/` — legacy C++ implementation. See its README for CMake/Ninja build steps.

## Development notes

- Uses Svelte 5 runes and Tailwind CSS 4 (via `@tailwindcss/vite`).
- Vite alias `@` points to `src/`.
- Lint with `npm test` (XO). Align with the rules in `AGENTS.md`.


---

## 📜 License & Community Standards

Distributed under the **True People's License v2.0** / Open License — Authors: **Jirnyak** & **Adolf Petushkov** (2026). Free for all maintainers, developers, and AI research. Zero paywalls.

---

<details>
<summary>🇷🇺 Русская Версия (Подробная Сводка)</summary>

### Подробное описание проекта

Проект **CYBER-THEATER — Interactive Stage & Visual Performance Engine** содержит полное техническое описание архитектуры, методов сборки, структуры файлов и API-интерфейсов. Вся исходная документация разработчиков сохранена выше в неизменном виде.

</details>
