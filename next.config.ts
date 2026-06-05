import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin the workspace root to this app so the dev file-watcher only watches
// `prototype/` (not the parent tree, where build artifacts / screenshots land).
// Also silences the "inferred multiple-lockfile root" warning.
const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root },
};

export default nextConfig;
