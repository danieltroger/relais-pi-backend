import { promises as fs_promises } from "fs";
import { createSignal, Owner, untrack, Signal } from "solid-js";
import path from "path";
import { log } from "./logging";
import process from "process";
import { computed_with_owner, run_catch_log } from "./utils";

export type Config = {
  non_reactive_gpio_state_to_persist_program_restarts: { [key: string]: 0 | 1 }; // We could type this properly to the GPIO outputs but that could risk trouble with recursive imports
  schedules: {
    [key: string]: {
      start_time: {
        hour: number;
        minute: number;
      };
      end_time: {
        hour: number;
        minute: number;
      };
    }[];
  };
  physical_light_switch_blocked: boolean;
};

const default_config: Config = {
  non_reactive_gpio_state_to_persist_program_restarts: {},
  schedules: {},
  physical_light_switch_blocked: false,
};

export async function get_config_object(owner: Owner) {
  let config_writing_debounce: ReturnType<typeof setTimeout> | undefined;
  let current_config_file_value: string | undefined;

  const config_file_name = path.dirname(process.argv[1]) + "/../config.json";
  log("Using", config_file_name, "as config file");

  let existing_config: Partial<Config> = {};
  if (!(await fs_promises.access(config_file_name, 0 /* 0 is F_OK */).catch(() => true))) {
    try {
      existing_config = JSON.parse(
        (current_config_file_value = await fs_promises.readFile(config_file_name, { encoding: "utf-8" }))
      );
    } catch (e) {
      log("Error parsing config file", e, "ignoring it");
      existing_config = {};
    }
  }
  const initial_config = { ...default_config, ...existing_config } as const;
  const config_signal = createSignal<Config>(initial_config);
  const [get_config, set_actual_config] = config_signal;

  computed_with_owner(owner, () => {
    // We could use records and tuples here in the future
    const new_config = JSON.stringify(get_config());
    if (current_config_file_value !== new_config) {
      clearTimeout(config_writing_debounce);
      setTimeout(
        run_catch_log(async () => {
          await fs_promises.writeFile(config_file_name, new_config, { encoding: "utf-8" });
          current_config_file_value = new_config;
        }, "Error writing config"),
        300
      );
    }
  });

  return [
    get_config,
    (new_value_or_setter: Config | ((prev: Config) => Config)) => {
      const set = (new_value: Config) => {
        set_actual_config({ ...default_config, ...new_value }); // So that users can't accidentally delete keys
      };
      if (typeof new_value_or_setter === "function") {
        set(new_value_or_setter(untrack(get_config)));
      } else {
        set(new_value_or_setter);
      }
    },
  ] as Signal<Config>;
}
