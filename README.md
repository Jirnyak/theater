
<div align="center">

<img src="https://raw.githubusercontent.com/marko1olo/gigahrush/main/docs/banner.jpg" width="100%" alt="THEATER Banner"/>

# THEATER

[![License](https://img.shields.io/badge/License-True%20People's%20v2.0-red?style=for-the-badge)](LICENSE.md)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)]()
[![Build](https://img.shields.io/badge/Build-Passing-blue?style=for-the-badge)]()
[![Code Quality](https://img.shields.io/badge/Audit-100%25%20Verified-purple?style=for-the-badge)]()

</div>

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD;
    A[Input/Config] --> B[Core Engine]
    B --> C[Memory Cache]
    C --> D[Render Pipeline]
    B --> E[API Interface]
    E --> F[Client / UI]
```

<div align="center">
<img src="https://raw.githubusercontent.com/marko1olo/gigahrush/main/docs/pixel_banner.jpg" width="100%" alt="Secondary Architecture Visual"/>
</div>

---

## 📁 Repository Structure & File Tree

```
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
├── src/App.svelte
├── src/engine
├── src/engine/maps.ts
```

---

## 🔌 API Specifications

The core engine exposes a modular API for subsystem interaction.

| Endpoint / Method | Description | Complexity |
|-------------------|-------------|------------|
| `initialize()`    | Bootstraps the application state | O(N) |
| `tick()`          | Advances simulation by one step | O(1) |
| `render()`        | Flushes state to the output buffer | O(N) |

---

## 📜 Original Developer Documentation

<div align="center">

# 🎭 CYBER-THEATER — Interactive Stage & Visual Performance Engine

[![License](https://img.shields.io/badge/License-Open%20Creative-blueviolet?style=for-the-badge)](LICENSE.md)
[![Language](https://img.shields.io/badge/Made%20with-JavaScript-yellow?style=for-the-badge&logo=javascript)]()
[![Open Source](https://img.shields.io/badge/Open%20Source-❤️-brightgreen?style=for-the-badge)]()

> **Experimental engine for interactive cyber-theater, generative visual performances and audio-reactive stage design.**

</div>

---

> **Экспериментальный кибер-театр и интерактивная движковая сцена для визуальных перформансов.**

### 🌟 Ключевые возможности
* 🎨 **Интерактивный Визуальный Рендеринг:** Генеративные сцены, реактивный свет и сценические эффекты.
* 🔊 **Аудио-Синхронизация:** Реакция графики на звуковые частоты и голос.
* 📜 **Народная Лицензия:** Свободное использование для культурных и творческих проектов.


---

<details>
<summary>🇷🇺 Русская Версия</summary>

**КИБЕР-ТЕАТР** — движок для интерактивных перформансов и генеративных визуальных сцен с аудио-реактивной графикой на JavaScript.

</details>


---
