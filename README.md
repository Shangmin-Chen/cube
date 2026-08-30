# 🧊 Cube - Interactive Rubik's Cube Speedcubing & Training Suite

**Cube** is a modern, interactive web application built for Rubik's cube speedsolvers. It provides an intuitive 3D Rubik's cube visualizer, comprehensive CFOP method tutorials (Cross, F2L, 2-Look/Full OLL, 2-Look/Full PLL), an algorithm flashcard trainer with progress tracking, and a WCA-compliant speedsolving timer.

---

## 🌟 Key Features

* **🎲 Interactive 3D Rubik's Cube Engine**: Built with Three.js featuring drag-to-rotate orbit controls, step-by-step algorithm playback, speed adjustment, and CFOP piece highlight modes.
* **⏱️ WCA Speedsolving Timer**: Includes WCA 3x3 scramble generation, 3D scramble preview, 15s inspection option, solve history log (+2 / DNF penalties), and live statistics dashboard (Best, Ao5, Ao12).
* **📚 CFOP Tutorials & Intuitive Mechanics**: Explains *why* algorithms work by tracking F2L pair orbits and core triggers (Sexy move `R U R' U'`, Sune `R U R' U R U2 R'`, T-Perm, U-Perm).
* **🧠 Algorithm Flashcard Trainer**: Practice 2-Look OLL, 2-Look PLL, and Full PLL with mastery tracking and visual 2D diagrams.
* **🔍 Searchable Algorithm Reference**: Searchable database of OLL and PLL cases with bookmarks and 3D playback modals.

---

## 🛠️ Tech Stack

* **Frontend**: React 19 + TypeScript
* **Build Tool**: Vite 8
* **Styling**: Tailwind CSS v4
* **3D Engine**: Three.js
* **Icons**: Lucide React
* **Effects**: Canvas Confetti

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
