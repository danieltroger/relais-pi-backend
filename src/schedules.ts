import { Config } from "./config";
import { Accessor, createEffect, createMemo, For, Index, onCleanup, untrack } from "solid-js";
import { init_gpio } from "./gpio";
import { run_catch_log } from "./utils";
import { log } from "./logging";

export function schedules({
  get_config,
  gpio,
}: {
  get_config: Accessor<Config>;
  gpio: Awaited<ReturnType<typeof init_gpio>>;
}) {
  const schedules = createMemo(() => get_config().schedules);
  const day = createMemo(() => new Date().getDay());
  const do_every = ({ when, action }: { when: Accessor<{ hour: number; minute: number }>; action: VoidFunction }) => {
    createEffect(() => {
      const { hour, minute } = when();
      day(); // re-start new timer when the day changes
      const now = new Date();
      if (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() > minute)) {
        // Time has passed today, don't do anything
        return;
      }
      const date = new Date();
      date.setHours(hour);
      date.setMinutes(minute);
      date.setSeconds(0);
      date.setMilliseconds(0);
      do_at({
        date,
        action,
      });
    });
  };

  For({
    get each() {
      return Object.keys(schedules());
    },
    children: gpio_label => {
      const schedule = createMemo(() => schedules()[gpio_label]);

      Index({
        get each() {
          return schedule();
        },
        children: schedule => {
          do_every({
            when: createMemo(() => schedule().start_time),
            action: () => {
              log(`Turning on ${gpio_label}, time is ${new Date().toISOString()} due to schedule `, untrack(schedule));
              gpio.outputs[gpio_label](0);
            },
          });

          do_every({
            when: createMemo(() => schedule().end_time),
            action: () => {
              log(`Turning off ${gpio_label}, time is ${new Date().toISOString()} due to schedule `, untrack(schedule));
              gpio.outputs[gpio_label](1);
            },
          });
          return undefined;
        },
      });

      return undefined;
    },
  });
}

function do_at({ date, action }: { date: Date; action: VoidFunction }) {
  const next_run = +date - +new Date();
  const timeout = setTimeout(run_catch_log(action), next_run);
  onCleanup(() => clearTimeout(timeout));
}
