import { createRoot, getOwner, runWithOwner } from "solid-js";
import { get_config_object } from "./config";
import { init_gpio } from "./gpio";
import { ws_messaging } from "./ws_messaging";

createRoot(main);

async function main() {
  const owner = getOwner()!;

  const config_signal = await get_config_object(owner);
  const [get_config] = config_signal;

  const gpio = await runWithOwner(owner, () => init_gpio(config_signal));

  await ws_messaging({
    config_signal,
    gpio,
    owner,
  });
}
