import { init_gpio } from "./gpio";
import { createEffect, on } from "solid-js";

export function light_switch({
  inputs: { light_switch },
  outputs: {
    garage_light: [, set_garage_light],
  },
}: Awaited<ReturnType<typeof init_gpio>>) {
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
}
