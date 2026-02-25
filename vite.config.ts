import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

// Forcefully remove the global variable if it exists so Electron doesn't launch in headless Node mode
delete process.env.ELECTRON_RUN_AS_NODE;

export default defineConfig({
    plugins: [
        react(),
        electron({
            main: {
                entry: { main: 'src/main/index.ts' },
            },
            preload: {
                input: { preload: path.join(__dirname, 'src/preload/index.ts') },
            },
            renderer: {},
        }),
    ],
});
