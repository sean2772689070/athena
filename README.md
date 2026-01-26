# Athena

Athena is a modern desktop application built with Electron, Vue 3, and TypeScript. It leverages the power of Vite for fast development and build times, and uses Naive UI for a polished user interface.

## 🚀 Tech Stack

- **Core:** [Electron](https://www.electronjs.org/)
- **Frontend Framework:** [Vue 3](https://vuejs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **UI Component Library:** [Naive UI](https://www.naiveui.com/)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Internationalization:** [Vue I18n](https://vue-i18n.intlify.dev/)
- **Packaging:** [Electron Forge](https://www.electronforge.io/)

## 📂 Project Structure

The project follows a standard Electron + Vite structure:

```
athena/
├── main/                 # Electron main process code
│   └── index.ts          # Main process entry point
├── renderer/             # Vue 3 renderer process code (UI)
│   ├── App.vue           # Root Vue component
│   ├── index.ts          # Renderer entry point
│   ├── i18n.ts           # I18n configuration
│   └── ...
├── html/                 # HTML entry points
│   ├── index.html        # Main window HTML
│   ├── setting.html      # Settings window HTML
│   └── dialog.html       # Dialog window HTML
├── locales/              # I18n translation files (en.json, zh.json)
├── preload.ts            # Electron preload script
├── forge.config.ts       # Electron Forge configuration
├── vite.main.config.ts   # Vite config for main process
├── vite.preload.config.ts# Vite config for preload script
├── vite.renderer.config.ts # Vite config for renderer process
└── package.json          # Project dependencies and scripts
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (Recommended: LTS version)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd athena
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Development

To start the application in development mode with hot-reload:

```bash
npm start
```

This command runs `electron-forge start`, which spins up the Vite dev server and launches the Electron app.

## 📦 Building & Distribution

To package the application for production:

```bash
npm run package
```

To create installers/distributables (e.g., .exe, .dmg, .deb):

```bash
npm run make
```

To publish the application (requires configuration):

```bash
npm run publish
```

## 🧩 Architecture

- **Main Process:** Handles the application lifecycle, window creation, and native system interactions. Entry point: `main/index.ts`.
- **Renderer Process:** Runs the Vue application. Entry point: `renderer/index.ts`.
- **Communication:** Communication between Main and Renderer processes should be handled via `ipcMain` and `ipcRenderer` (exposed via `preload.ts`).
- **Styling:** Tailwind CSS is configured for utility-first styling, alongside Naive UI components.

## 📝 License

This project is licensed under the MIT License.
