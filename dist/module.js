import {createRoot as $72vZL$createRoot, getOwner as $72vZL$getOwner, runWithOwner as $72vZL$runWithOwner, createSignal as $72vZL$createSignal, untrack as $72vZL$untrack, createComputed as $72vZL$createComputed, on as $72vZL$on, createEffect as $72vZL$createEffect} from "solid-js/dist/dev.js";
import {promises as $72vZL$promises} from "fs";
import $72vZL$path from "path";
import $72vZL$process from "process";
import {Gpio as $72vZL$Gpio} from "onoff";
import {promisify as $72vZL$promisify} from "util";
import {exec as $72vZL$exec} from "child_process";
import {WebSocketServer as $72vZL$WebSocketServer} from "ws";





function $727cf30ea0cc9d6d$var$print(prefix, ...args) {
    console.log(prefix, new Date().toISOString(), ...args);
}
function $727cf30ea0cc9d6d$export$bef1f36f5486a6a3(...args) {
    $727cf30ea0cc9d6d$var$print("[LOG]", ...args);
}
function $727cf30ea0cc9d6d$export$c106dd0671a0fc2d(...args) {
    $727cf30ea0cc9d6d$var$print("[WARN]", ...args);
}
function $727cf30ea0cc9d6d$export$a3bc9b8ed74fc(...args) {
    $727cf30ea0cc9d6d$var$print("[ERROR]", ...args);
}





async function $4378e093e1af1250$export$5c069c93d2b7493f(time) {
    await new Promise((r)=>setTimeout(r, time));
}
function $4378e093e1af1250$export$fe8f1dea867b3946(fn, message) {
    return function() {
        try {
            const retval = Reflect.apply(fn, this, arguments);
            if (fn?.constructor?.name === "AsyncFunction" || typeof retval?.then === "function") return retval.catch((e)=>(0, $727cf30ea0cc9d6d$export$a3bc9b8ed74fc)(message, e));
            return retval;
        } catch (e) {
            (0, $727cf30ea0cc9d6d$export$a3bc9b8ed74fc)(message, e);
        }
    };
}
function $4378e093e1af1250$export$c42cdf9e488a0697(owner, fn) {
    (0, $72vZL$runWithOwner)(owner, ()=>(0, $72vZL$createComputed)(fn));
}
function $4378e093e1af1250$export$f241be8e610f5c77(the_function, error_message) {
    // taken from @depict-ai/utilishared package which we don't want to import due to its side effects
    let busy = false;
    let queued;
    let current_promise;
    const wrapped_fn = $4378e093e1af1250$export$fe8f1dea867b3946(async (...args)=>{
        // Double awaits to make sure that if busy is true, it must also be true two ticks later.
        // This is a fix for when a promise that finalizes immediately is passed.
        // For context: https://javascript.info/microtask-queue
        if (!busy || !(await await busy, busy)) {
            busy = true;
            const to_finally = $4378e093e1af1250$export$fe8f1dea867b3946(the_function, error_message)(...args);
            current_promise = (to_finally || Promise.resolve()).finally(()=>{
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


const $aa9bf34e18c341ec$var$default_config = {
    non_reactive_gpio_state_to_persist_program_restarts: {}
};
async function $aa9bf34e18c341ec$export$63203fc43b45b793(owner) {
    let config_writing_debounce;
    let current_config_file_value;
    const config_file_name = (0, $72vZL$path).dirname((0, $72vZL$process).argv[1]) + "/../config.json";
    (0, $727cf30ea0cc9d6d$export$bef1f36f5486a6a3)("Using", config_file_name, "as config file");
    let existing_config = {};
    if (!await (0, $72vZL$promises).access(config_file_name, 0 /* 0 is F_OK */ ).catch(()=>true)) try {
        existing_config = JSON.parse(current_config_file_value = await (0, $72vZL$promises).readFile(config_file_name, {
            encoding: "utf-8"
        }));
    } catch (e) {
        (0, $727cf30ea0cc9d6d$export$bef1f36f5486a6a3)("Error parsing config file", e, "ignoring it");
        existing_config = {};
    }
    const initial_config = {
        ...$aa9bf34e18c341ec$var$default_config,
        ...existing_config
    };
    const config_signal = (0, $72vZL$createSignal)(initial_config);
    const [get_config, set_actual_config] = config_signal;
    (0, $4378e093e1af1250$export$c42cdf9e488a0697)(owner, ()=>{
        // We could use records and tuples here in the future
        const new_config = JSON.stringify(get_config());
        if (current_config_file_value !== new_config) {
            clearTimeout(config_writing_debounce);
            setTimeout((0, $4378e093e1af1250$export$fe8f1dea867b3946)(async ()=>{
                await (0, $72vZL$promises).writeFile(config_file_name, new_config, {
                    encoding: "utf-8"
                });
                current_config_file_value = new_config;
            }, "Error writing config"), 300);
        }
    });
    return [
        get_config,
        (new_value_or_setter)=>{
            const set = (new_value)=>{
                set_actual_config({
                    ...$aa9bf34e18c341ec$var$default_config,
                    ...new_value
                }); // So that users can't accidentally delete keys
            };
            if (typeof new_value_or_setter === "function") set(new_value_or_setter((0, $72vZL$untrack)(get_config)));
            else set(new_value_or_setter);
        }
    ];
}








const $b6f2ed96127d12a5$export$78e3044358792147 = (0, $72vZL$promisify)((0, $72vZL$exec));


async function $a6166442b4560594$export$90ed46c0f5657f4f([get_config, set_config]) {
    const inputs = {
        light_switch: 5
    };
    const outputs = {
        garden_pump: 25,
        garage_light: 24,
        living_room_extension_cable: 23,
        electric_screwdriver_charger: 22,
        living_room_distribution_socket: 27
    };
    const owner = (0, $72vZL$getOwner)();
    const return_value = {
        inputs: Object.fromEntries(await Promise.all(Object.entries(inputs).map(async ([label, pin_number])=>{
            const gpio_object = new (0, $72vZL$Gpio)(pin_number, "in", "both");
            // set pull up resistor to down (motor protection input can't be read otherwise)
            const { stdout: stdout , stderr: stderr  } = await (0, $b6f2ed96127d12a5$export$78e3044358792147)(`gpio -g mode ${pin_number} down`);
            if (stderr) (0, $727cf30ea0cc9d6d$export$a3bc9b8ed74fc)(`Couldn't set pull up/down resistor for pin ${pin_number} (${label}), stdout: ${JSON.stringify(stdout)}, stderr: ${JSON.stringify(stderr)}`);
            const [accessor, setter] = (0, $72vZL$createSignal)(await gpio_object.read());
            gpio_object.watch((failure, value)=>{
                if (failure) {
                    (0, $727cf30ea0cc9d6d$export$a3bc9b8ed74fc)(`Error watching gpio pin ${pin_number} (${label})`, failure);
                    return;
                }
                setter(value);
            });
            return [
                label,
                accessor
            ];
        }))),
        outputs: Object.fromEntries(await Promise.all(Object.entries(outputs).map(async ([label, pin_number])=>{
            // Don't think we can read what's currently set? So we get it from what we've saved in the config file.
            const initial_value = (0, $72vZL$untrack)(get_config).non_reactive_gpio_state_to_persist_program_restarts[label] ?? 1;
            const gpio_object = new (0, $72vZL$Gpio)(pin_number, initial_value ? "high" : "low");
            const signal = (0, $72vZL$createSignal)(initial_value);
            const [accessor] = signal;
            (0, $727cf30ea0cc9d6d$export$bef1f36f5486a6a3)(`Initialized GPIO pin ${pin_number} (${label}) with initial value: ${initial_value}`);
            (0, $4378e093e1af1250$export$c42cdf9e488a0697)(owner, (0, $72vZL$on)(accessor, (0, $4378e093e1af1250$export$f241be8e610f5c77)(async (new_value)=>await gpio_object.write(new_value), `failed writing GPIO pin ${pin_number} (${label})`), {
                defer: true
            }));
            return [
                label,
                signal
            ];
        })))
    };
    (0, $72vZL$runWithOwner)(owner, ()=>(0, $72vZL$createEffect)(()=>{
            // Write GPIO output values to config file for program restarts
            // This is so that the stove doesn't shut down if we have to restart the program
            const non_reactive_gpio_state_to_persist_program_restarts = {};
            const { outputs: outputs  } = return_value;
            for(const label in outputs){
                const [get_value] = outputs[label];
                non_reactive_gpio_state_to_persist_program_restarts[label] = get_value();
            }
            set_config((prev)=>({
                    ...prev,
                    non_reactive_gpio_state_to_persist_program_restarts: non_reactive_gpio_state_to_persist_program_restarts
                }));
        }));
    return return_value;
}






const $2ffda6b15638573c$var$max_connection_age = 3600000; //ms
const $2ffda6b15638573c$var$ping_interval = 5000; // ms
const $2ffda6b15638573c$var$port = 9321;
const $2ffda6b15638573c$var$connections = new Set();
async function $2ffda6b15638573c$export$951c2e5e535c1889(handle_message) {
    let wss;
    const start_server = ()=>{
        wss = new (0, $72vZL$WebSocketServer)({
            port: $2ffda6b15638573c$var$port
        });
        wss.on("error", (0, $4378e093e1af1250$export$fe8f1dea867b3946)(async (e)=>{
            (0, $727cf30ea0cc9d6d$export$a3bc9b8ed74fc)("WS server had an error", e, "restarting it in 5s");
            wss.close();
            await (0, $4378e093e1af1250$export$5c069c93d2b7493f)(5000);
            start_server();
        }));
        wss.on("connection", (0, $4378e093e1af1250$export$fe8f1dea867b3946)(async (ws)=>{
            $2ffda6b15638573c$var$connections.add(ws);
            let last_movement = +new Date();
            ws.on("close", ()=>last_movement = 0);
            ws.on("error", (0, $4378e093e1af1250$export$fe8f1dea867b3946)((m)=>{
                (0, $727cf30ea0cc9d6d$export$bef1f36f5486a6a3)("Connection had error, killing it", m);
                last_movement = 0;
            }));
            ws.on("pong", ()=>last_movement = +new Date());
            ws.on("message", (0, $4378e093e1af1250$export$fe8f1dea867b3946)(async (data)=>{
                const decoded = JSON.parse(data.toString());
                if (!decoded.id) {
                    (0, $727cf30ea0cc9d6d$export$c106dd0671a0fc2d)("Cannot handle message", decoded, data, "because it doesn't have an id");
                    return;
                }
                ws.send(JSON.stringify({
                    id: decoded.id,
                    status: "ack"
                }));
                const response = await handle_message(decoded);
                if (response) ws.send(response);
            }));
            while(+new Date() - last_movement < $2ffda6b15638573c$var$max_connection_age){
                ws.ping(Math.random() + "");
                await (0, $4378e093e1af1250$export$5c069c93d2b7493f)($2ffda6b15638573c$var$ping_interval);
            }
            ws.close();
            $2ffda6b15638573c$var$connections.delete(ws);
        }));
        (0, $727cf30ea0cc9d6d$export$bef1f36f5486a6a3)("Started websocket server");
    };
    start_server();
    const broadcast = (0, $4378e093e1af1250$export$fe8f1dea867b3946)((msg)=>{
        for (const connection of $2ffda6b15638573c$var$connections)connection.send(msg);
    });
    return {
        broadcast: broadcast
    };
}




async function $6ac2e3a48effee46$export$b5b89ed5e6f7f426({ config_signal: [get_config, set_config] , gpio: gpio , owner: owner  }) {
    const exposed_signals = {
        config: {
            getter: get_config,
            setter: set_config,
            validator: (value)=>{
                if (typeof value !== "object") return "Can't write config, not an object: " + value;
            }
        },
        gpio: {
            getter: ()=>$6ac2e3a48effee46$var$serialize_gpio(gpio)
        }
    };
    const { broadcast: broadcast  } = await (0, $2ffda6b15638573c$export$951c2e5e535c1889)(async (msg)=>{
        const { command: command , key: key , value: value , id: id  } = msg;
        if (command === "write-gpio") {
            // special case for GPIO because it is an object containing signals and I already wrote all this validation code
            if (typeof value !== "object") return JSON.stringify({
                id: id,
                status: "not-ok",
                message: "Can't write gpio, not an object: " + value
            });
            const { output: output , new_state: new_state  } = value;
            if (!gpio.outputs[output]) return JSON.stringify({
                id: id,
                status: "not-ok",
                message: "Can't write gpio, output not found: " + output
            });
            if (new_state !== 0 && new_state !== 1) return JSON.stringify({
                id: id,
                status: "not-ok",
                message: "Can't write gpio, new_state not 0 or 1: " + new_state
            });
            (0, $727cf30ea0cc9d6d$export$bef1f36f5486a6a3)(`Setting GPIO ${JSON.stringify(output)} to ${JSON.stringify(new_state)} due to WS message`);
            gpio.outputs[output][1](new_state);
            return JSON.stringify({
                id: id,
                status: "ok"
            });
        } else if (command === "read" || command === "write") {
            const specifier = exposed_signals[key];
            if (!specifier) return JSON.stringify({
                id: id,
                status: "not-ok",
                message: `No signal with key: ${key}, allowed keys: ${Object.keys(exposed_signals).join(", ")}`
            });
            const { getter: getter  } = specifier;
            if (command === "read") return JSON.stringify({
                id: id,
                status: "ok",
                value: (0, $72vZL$untrack)(()=>getter())
            });
            else if (command === "write") {
                if (!("setter" in specifier)) return JSON.stringify({
                    id: id,
                    status: "not-ok",
                    message: `Can't write to signal with key: ${key}, it is read-only`
                });
                if ("validator" in specifier) {
                    const error = specifier.validator(value);
                    if (error) return JSON.stringify({
                        id: id,
                        status: "not-ok",
                        message: error
                    });
                }
                specifier.setter(value);
                return JSON.stringify({
                    id: id,
                    status: "ok",
                    value: value
                });
            }
        }
        return JSON.stringify({
            id: id,
            status: "not-ok",
            message: "Command not recognized: " + command
        });
    });
    for(const key in exposed_signals){
        const { getter: getter  } = exposed_signals[key];
        (0, $4378e093e1af1250$export$c42cdf9e488a0697)(owner, ()=>broadcast(JSON.stringify({
                id: Math.random() + "",
                type: "change",
                key: key,
                "value": getter()
            })));
    }
}
function $6ac2e3a48effee46$var$serialize_gpio(gpio) {
    return {
        inputs: Object.fromEntries(Object.entries(gpio.inputs).map(([label, accessor])=>[
                label,
                accessor()
            ])),
        outputs: Object.fromEntries(Object.entries(gpio.outputs).map(([label, [accessor]])=>[
                label,
                accessor()
            ]))
    };
}



function $c215085ba5d2c85a$export$a2a1d3f8b8c31e48(gpio) {
    (0, $72vZL$createEffect)(()=>gpio.outputs.garage_light[1](gpio.inputs.light_switch()));
}


(0, $72vZL$createRoot)($f49e5f5ee91f044f$var$main);
async function $f49e5f5ee91f044f$var$main() {
    const owner = (0, $72vZL$getOwner)();
    const config_signal = await (0, $aa9bf34e18c341ec$export$63203fc43b45b793)(owner);
    const [get_config] = config_signal;
    const gpio = await (0, $72vZL$runWithOwner)(owner, ()=>(0, $a6166442b4560594$export$90ed46c0f5657f4f)(config_signal));
    await (0, $6ac2e3a48effee46$export$b5b89ed5e6f7f426)({
        config_signal: config_signal,
        gpio: gpio,
        owner: owner
    });
    (0, $72vZL$runWithOwner)(owner, ()=>(0, $c215085ba5d2c85a$export$a2a1d3f8b8c31e48)(gpio));
}


