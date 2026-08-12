import "temporal-polyfill/global";
import { createApiClient } from "@potty/shared";
import { loadWebConfig } from "./config.js";
import { PottyTrackerView } from "./PottyTrackerView.js";

const config = loadWebConfig(import.meta.env);

export function App() {
  const client = createApiClient(config);
  return <PottyTrackerView client={client} />;
}
