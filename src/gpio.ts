import { Gpio } from "onoff";
import { Accessor, createEffect, createSignal, getOwner, on, runWithOwner, Signal, untrack } from "solid-js";
import { error, log } from "./logging";
import { computed_with_owner, deparallelize_no_drop } from "./utils";
import { exec } from "./exec";
import { Config } from "./config";

export async function init_gpio([get_config, set_config]: Signal<Config>) {
  const inputs = { light_switch: 5 };
  const outputs = {
    garden_pump: 25,
    garage_light: 24,
    living_room_extension_cable: 23,
    electric_screwdriver_charger: 22,
    living_room_distribution_socket: 27,
  };
  const owner = getOwner()!;
  const return_value = {
    inputs: Object.fromEntries(
      await Promise.all(
        Object.entries(inputs).map(async ([label, pin_number]) => {
          const gpio_object = new Gpio(pin_number, "in", "both");
          // set pull up resistor to down (motor protection input can't be read otherwise)
          const { stdout, stderr } = await exec(`gpio -g mode ${pin_number} down`);
          if (stderr) {
            error(
              `Couldn't set pull up/down resistor for pin ${pin_number} (${label}), stdout: ${JSON.stringify(
                stdout
              )}, stderr: ${JSON.stringify(stderr)}`
            );
          }
          const [accessor, setter] = createSignal<0 | 1>(await gpio_object.read());
          gpio_object.watch((failure, value) => {
            if (failure) {
              error(`Error watching gpio pin ${pin_number} (${label})`, failure);
              return;
            }
            setter(value);
          });
          return [label, accessor];
        })
      )
    ) as { [K in keyof typeof inputs]: Accessor<0 | 1> },
    outputs: Object.fromEntries(
      await Promise.all(
        Object.entries(outputs).map(async ([label, pin_number]) => {
          // Don't think we can read what's currently set? So we get it from what we've saved in the config file.
          const initial_value = untrack(get_config).non_reactive_gpio_state_to_persist_program_restarts[label] ?? 1;
          const gpio_object = new Gpio(pin_number, initial_value ? "high" : "low");
          const signal = createSignal<0 | 1>(initial_value);
          const [accessor] = signal;

          log(`Initialized GPIO pin ${pin_number} (${label}) with initial value: ${initial_value}`);

          computed_with_owner(
            owner,
            on(
              accessor,
              deparallelize_no_drop(
                async new_value => await gpio_object.write(new_value),
                `failed writing GPIO pin ${pin_number} (${label})`
              ),
              { defer: true }
            )
          );
          return [label, signal];
        })
      )
    ) as { [K in keyof typeof outputs]: Signal<0 | 1> },
  };

  runWithOwner(owner, () =>
    createEffect(() => {
      // Write GPIO output values to config file for program restarts
      // This is so that the stove doesn't shut down if we have to restart the program
      const non_reactive_gpio_state_to_persist_program_restarts: { [key: string]: 0 | 1 } = {};
      const { outputs } = return_value;
      for (const label in outputs) {
        const [get_value] = outputs[label as keyof typeof outputs];
        non_reactive_gpio_state_to_persist_program_restarts[label] = get_value();
      }
      set_config(prev => ({ ...prev, non_reactive_gpio_state_to_persist_program_restarts }));
    })
  );

  return return_value;
}
