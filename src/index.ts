import { createRoot, ErrorBoundary, getOwner, runWithOwner } from "solid-js";
import { get_config_object } from "./config";
import { init_gpio } from "./gpio";
import { ws_messaging } from "./ws_messaging";
import { light_switch } from "./light_switch";
import { schedules } from "./schedules";

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

  runWithOwner(owner, () => light_switch(gpio, get_config));

  runWithOwner(owner, () =>
    ErrorBoundary({
      fallback: error => {
        console.error("Schedules failed", error);
        return [];
      },
      get children() {
        schedules({ get_config, gpio });
        return undefined;
      },
    })
  );
}
