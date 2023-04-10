import { init_gpio } from "./gpio";
import { Accessor, createEffect, createMemo, on, Show } from "solid-js";
import { Config } from "./config";

export function light_switch(
  {
    inputs: { light_switch },
    outputs: {
      garage_light: [, set_garage_light],
    },
  }: Awaited<ReturnType<typeof init_gpio>>,
  config: Accessor<Config>
) {
  const switch_enabled = createMemo(() => !config().physical_light_switch_blocked);
  Show({
    get when() {
      return switch_enabled();
    },
    get children() {
      createEffect(
        on(
          light_switch,
          () => {
            // every time physical switch is toggled
            set_garage_light(old_value => (old_value === 1 ? 0 : 1)); // toggle light
          },
          { defer: true }
        )
      );
      return undefined;
    },
  });
}
