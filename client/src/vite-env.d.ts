/// <reference types="vite/client" />

interface ImportMetaEnv {
  // "false" hides the React Query devtools in dev (see App.tsx).
  readonly VITE_QUERY_DEVTOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

