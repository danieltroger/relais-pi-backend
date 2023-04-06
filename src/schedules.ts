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
  const do_every = ({
    hour_accessor,
    minute_accessor,
    action,
    run_now_if_after_start_and_before_this,
  }: {
    hour_accessor: Accessor<number>;
    minute_accessor: Accessor<number>;
    action: VoidFunction;
    run_now_if_after_start_and_before_this?: { hour: Accessor<number>; minute: Accessor<number> };
  }) => {
    createEffect(() => {
      const hour = hour_accessor();
      const minute = minute_accessor();
      day(); // re-start new timer when the day changes
      const now = new Date();
      if (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() > minute)) {
        // Time has passed today, don't schedule anything
        // But if we are after the start time and before the end time, run it now since we're in the slot
        if (run_now_if_after_start_and_before_this) {
          const end_hour = run_now_if_after_start_and_before_this.hour();
          const end_minute = run_now_if_after_start_and_before_this.minute();
          if (now.getHours() < end_hour || (now.getHours() === end_hour && now.getMinutes() < end_minute)) {
            log(`Running action for ${hour}:${minute} now because it is after start time and before end time`);
            action();
          }
        }
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
      const [get_gpio, set_gpio] = gpio.outputs[gpio_label as keyof typeof gpio.outputs];

      Index({
        get each() {
          return schedule();
        },
        children: schedule => {
          const end_hour = createMemo(() => schedule().end_time.hour);
          const end_minute = createMemo(() => schedule().end_time.minute);
          do_every({
            hour_accessor: createMemo(() => schedule().start_time.hour),
            minute_accessor: createMemo(() => schedule().start_time.minute),
            action: () => {
              if (untrack(get_gpio) === 0) return;
              log(`Turning on ${gpio_label}, time is ${new Date().toISOString()} due to schedule `, untrack(schedule));
              set_gpio(0);
            },
            run_now_if_after_start_and_before_this: {
              hour: end_hour,
              minute: end_minute,
            },
          });

          do_every({
            hour_accessor: end_hour,
            minute_accessor: end_minute,
            action: () => {
              if (untrack(get_gpio) === 1) return;
              log(`Turning off ${gpio_label}, time is ${new Date().toISOString()} due to schedule `, untrack(schedule));
              set_gpio(1);
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
