import { error } from "./logging";
import { createComputed, Owner, runWithOwner } from "solid-js";
import { EffectFunction } from "solid-js/types/reactive/signal";

export async function wait(time: number) {
  await new Promise(r => setTimeout(r, time));
}

export function run_catch_log<T extends any[], X>(fn: (...args: T) => X, message?: string) {
  return function () {
    try {
      const retval = Reflect.apply(fn, this, arguments);
      if (fn?.constructor?.name === "AsyncFunction" || typeof retval?.then === "function") {
        return retval.catch(e => error(message, e));
      }
      return retval;
    } catch (e) {
      error(message, e);
    }
  } as (...args: T) => X extends Promise<any> ? Promise<undefined | Awaited<X>> : X | undefined;
}

export function computed_with_owner(owner: Owner, fn: VoidFunction | EffectFunction<any>) {
  runWithOwner(owner, () => createComputed(fn));
}

export type AsyncFunction<A extends any[], O> = (...args: A) => Promise<O>;

/**
 * Describes another function this one is based of: Wraps an async function and makes sure the returned wrapped function can only be "executing" once at the same time.
 * What this actually does: it's like what's described above, but it makes sure that the last call of the function, while it's busy, will be executed after it's no longer busy.
 * @param  the_function an async function to wrap
 * @return         The same function but wrapped so that it can only run once at once, no matter how often you call it
 */
export function deparallelize_no_drop<A extends any[], O>(
  the_function: AsyncFunction<A, O>,
  error_message?: string
): (...args: A) => Promise<O> {
  // taken from @depict-ai/utilishared package which we don't want to import due to its side effects
  let busy = false;
  let queued;
  let current_promise;
  const wrapped_fn = run_catch_log(async (...args: A) => {
    // Double awaits to make sure that if busy is true, it must also be true two ticks later.
    // This is a fix for when a promise that finalizes immediately is passed.
    // For context: https://javascript.info/microtask-queue
    if (!busy || !(await await busy, busy)) {
      busy = true;
      const to_finally = run_catch_log(the_function, error_message)(...args);
      current_promise = (to_finally || Promise.resolve()).finally(() => {
        busy = false;
        if (queued) {
          const q_val = queued;
          queued = undefined;
          wrapped_fn(...q_val);
        }
      });
    } else queued = args;
    return current_promise;
  });
  return wrapped_fn;
}
