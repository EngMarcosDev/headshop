import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "http://localhost:3000";

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: ["notarial-sunday-compressibly.ngrok-free.dev", "bacaxita.com.br", "www.bacaxita.com.br"],
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
