import "temporal-polyfill/global";
import { createApiClient } from "@potty/shared";
import { PottyTrackerView } from "./PottyTrackerView.js";

const baseUrl = import.meta.env.VITE_API_URL ?? "";
const apiKey = import.meta.env.VITE_API_KEY ?? "dev-api-key";

export function App() {
  const client = createApiClient({ baseUrl, apiKey });
  return <PottyTrackerView client={client} />;
}
