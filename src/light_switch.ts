import { init_gpio } from "./gpio";
import { createEffect } from "solid-js";

export function light_switch(gpio: Awaited<ReturnType<typeof init_gpio>>) {
  createEffect(() => gpio.outputs.garage_light[1](gpio.inputs.light_switch()));
}
