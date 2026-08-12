export interface WebConfig {
  baseUrl: string;
  apiKey: string;
}

export interface WebEnv {
  VITE_API_URL?: string;
  VITE_API_KEY?: string;
}

export function loadWebConfig(env: WebEnv): WebConfig {
  return {
    baseUrl: env.VITE_API_URL ?? "",
    apiKey: env.VITE_API_KEY ?? "dev-api-key",
  };
}
