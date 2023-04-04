import { Owner, Signal, untrack } from "solid-js";
import { Config } from "./config";
import { init_gpio } from "./gpio";
import { start_ws_server } from "./websocket_server";
import { computed_with_owner } from "./utils";
import { log } from "./logging";

export async function ws_messaging({
  config_signal: [get_config, set_config],
  gpio,
  owner,
}: {
  config_signal: Signal<Config>;
  gpio: Awaited<ReturnType<typeof init_gpio>>;
  owner: Owner;
}) {
  const exposed_signals = {
    config: {
      getter: get_config,
      setter: set_config,
      validator: value => {
        if (typeof value !== "object") {
          return "Can't write config, not an object: " + value;
        }
      },
    },
    gpio: { getter: () => serialize_gpio(gpio) },
  } as const;

  const { broadcast } = await start_ws_server(async (msg: { [key: string]: any }) => {
    const { command, key, value, id } = msg;

    if (command === "write-gpio") {
      // special case for GPIO because it is an object containing signals and I already wrote all this validation code
      if (typeof value !== "object") {
        return JSON.stringify({
          id,
          status: "not-ok",
          message: "Can't write gpio, not an object: " + value,
        });
      }
      const { output, new_state } = value;
      if (!gpio.outputs[output]) {
        return JSON.stringify({
          id,
          status: "not-ok",
          message: "Can't write gpio, output not found: " + output,
        });
      }
      if (new_state !== 0 && new_state !== 1) {
        return JSON.stringify({
          id,
          status: "not-ok",
          message: "Can't write gpio, new_state not 0 or 1: " + new_state,
        });
      }
      log(`Setting GPIO ${JSON.stringify(output)} to ${JSON.stringify(new_state)} due to WS message`);
      gpio.outputs[output][1](new_state);
      return JSON.stringify({ id, status: "ok" });
    } else if (command === "read" || command === "write") {
      const specifier = exposed_signals[key as keyof typeof exposed_signals];
      if (!specifier) {
        return JSON.stringify({
          id,
          status: "not-ok",
          message: `No signal with key: ${key}, allowed keys: ${Object.keys(exposed_signals).join(", ")}`,
        });
      }
      const { getter } = specifier;
      if (command === "read") {
        return JSON.stringify({ id, status: "ok", value: untrack(() => getter()) });
      } else if (command === "write") {
        if (!("setter" in specifier)) {
          return JSON.stringify({
            id,
            status: "not-ok",
            message: `Can't write to signal with key: ${key}, it is read-only`,
          });
        }
        if ("validator" in specifier) {
          const error = specifier.validator(value);
          if (error) {
            return JSON.stringify({ id, status: "not-ok", message: error });
          }
        }
        specifier.setter(value);
        return JSON.stringify({ id, status: "ok", value });
      }
    }
    return JSON.stringify({
      id,
      status: "not-ok",
      message: "Command not recognized: " + command,
    });
  });

  for (const key in exposed_signals) {
    const { getter } = exposed_signals[key as keyof typeof exposed_signals];
    computed_with_owner(owner, () =>
      broadcast(JSON.stringify({ id: Math.random() + "", type: "change", key, "value": getter() }))
    );
  }
}

function serialize_gpio(gpio: Awaited<ReturnType<typeof init_gpio>>) {
  return {
    inputs: Object.fromEntries(Object.entries(gpio.inputs).map(([label, accessor]) => [label, accessor()])),
    outputs: Object.fromEntries(Object.entries(gpio.outputs).map(([label, [accessor]]) => [label, accessor()])),
  };
}
