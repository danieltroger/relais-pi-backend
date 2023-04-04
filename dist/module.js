import {createRoot as $RlZpy$createRoot, getOwner as $RlZpy$getOwner, createSignal as $RlZpy$createSignal, runWithOwner as $RlZpy$runWithOwner, untrack as $RlZpy$untrack, createComputed as $RlZpy$createComputed, on as $RlZpy$on, createEffect as $RlZpy$createEffect, createMemo as $RlZpy$createMemo, For as $RlZpy$For, onCleanup as $RlZpy$onCleanup} from "solid-js/dist/dev.js";
import {promises as $RlZpy$promises} from "fs";
import $RlZpy$path from "path";
import $RlZpy$process from "process";
import {Gpio as $RlZpy$Gpio} from "onoff";
import {promisify as $RlZpy$promisify} from "util";
import {exec as $RlZpy$exec} from "child_process";
import $RlZpy$ping from "ping";
import {WebSocketServer as $RlZpy$WebSocketServer} from "ws";
import $RlZpy$nodepidcontroller from "node-pid-controller";
import {DCDC as $RlZpy$DCDC} from "dcdc-lib/index.js";


function $aef3f6d96f2300ed$var$print(prefix, ...args) {
    console.log(prefix, new Date().toISOString(), ...args);
}
function $aef3f6d96f2300ed$export$bef1f36f5486a6a3(...args) {
    $aef3f6d96f2300ed$var$print("[LOG]", ...args);
}
function $aef3f6d96f2300ed$export$c106dd0671a0fc2d(...args) {
    $aef3f6d96f2300ed$var$print("[WARN]", ...args);
}
function $aef3f6d96f2300ed$export$a3bc9b8ed74fc(...args) {
    $aef3f6d96f2300ed$var$print("[ERROR]", ...args);
}









async function $f71a05d906dba8ec$export$5c069c93d2b7493f(time) {
    await new Promise((r)=>setTimeout(r, time));
}
function $f71a05d906dba8ec$export$fe8f1dea867b3946(fn, message) {
    return function() {
        try {
            const retval = Reflect.apply(fn, this, arguments);
            if (fn?.constructor?.name === "AsyncFunction" || typeof retval?.then === "function") return retval.catch((e)=>(0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)(message, e));
            return retval;
        } catch (e) {
            (0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)(message, e);
        }
    };
}
function $f71a05d906dba8ec$export$c42cdf9e488a0697(owner, fn) {
    (0, $RlZpy$runWithOwner)(owner, ()=>(0, $RlZpy$createComputed)(fn));
}
function $f71a05d906dba8ec$export$f241be8e610f5c77(the_function, error_message) {
    // taken from @depict-ai/utilishared package which we don't want to import due to its side effects
    let busy = false;
    let queued;
    let current_promise;
    const wrapped_fn = $f71a05d906dba8ec$export$fe8f1dea867b3946(async (...args)=>{
        // Double awaits to make sure that if busy is true, it must also be true two ticks later.
        // This is a fix for when a promise that finalizes immediately is passed.
        // For context: https://javascript.info/microtask-queue
        if (!busy || !(await await busy, busy)) {
            busy = true;
            const to_finally = $f71a05d906dba8ec$export$fe8f1dea867b3946(the_function, error_message)(...args);
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


const $100ff35390bdcc97$var$default_config = {
    thermometers: {
        "28-031297943624": "akkumulator",
        "28-0120190f6059": "aussen",
        "28-031297943397": "innen"
    },
    temperature_report_interval: 3000,
    feeder_protection_triggered: false,
    stove_disabled: false,
    turn_stove_off_at: 75,
    turn_stove_on_at: 43,
    non_reactive_gpio_state_to_persist_program_restarts: {},
    pid_control: {
        input_sensor: "akkumulator",
        target_temperature: 75,
        k_p: 0.25,
        k_i: 0.01,
        k_d: 0.01,
        i_max: 200,
        pid_100_percent_value: 63
    }
};
async function $100ff35390bdcc97$export$63203fc43b45b793(owner) {
    let config_writing_debounce;
    let current_config_file_value;
    const config_file_name = (0, $RlZpy$path).dirname((0, $RlZpy$process).argv[1]) + "/../config.json";
    (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Using", config_file_name, "as config file");
    let existing_config = {};
    if (!await (0, $RlZpy$promises).access(config_file_name, 0 /* 0 is F_OK */ ).catch(()=>true)) try {
        existing_config = JSON.parse(current_config_file_value = await (0, $RlZpy$promises).readFile(config_file_name, {
            encoding: "utf-8"
        }));
    } catch (e) {
        (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Error parsing config file", e, "ignoring it");
        existing_config = {};
    }
    const initial_config = {
        ...$100ff35390bdcc97$var$default_config,
        ...existing_config
    };
    const config_signal = (0, $RlZpy$createSignal)(initial_config);
    const [get_config, set_actual_config] = config_signal;
    (0, $f71a05d906dba8ec$export$c42cdf9e488a0697)(owner, ()=>{
        // We could use records and tuples here in the future
        const new_config = JSON.stringify(get_config());
        if (current_config_file_value !== new_config) {
            clearTimeout(config_writing_debounce);
            setTimeout((0, $f71a05d906dba8ec$export$fe8f1dea867b3946)(async ()=>{
                await (0, $RlZpy$promises).writeFile(config_file_name, new_config, {
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
                    ...$100ff35390bdcc97$var$default_config,
                    ...new_value
                }); // So that users can't accidentally delete keys
            };
            if (typeof new_value_or_setter === "function") set(new_value_or_setter((0, $RlZpy$untrack)(get_config)));
            else set(new_value_or_setter);
        }
    ];
}








const $ba41cfbc3837684f$export$78e3044358792147 = (0, $RlZpy$promisify)((0, $RlZpy$exec));


async function $99bf9651739769b1$export$90ed46c0f5657f4f([get_config, set_config]) {
    const inputs = {
        pellets_chamber_lower_sensor: 16,
        pellets_chamber_upper_sensor: 6,
        motor_protection_triggered: 5
    };
    const outputs = {
        pellets_feeder_motor: 17,
        electric_heating_element: 23,
        stove: 27,
        temperature_sensor_power: 22
    };
    const owner = (0, $RlZpy$getOwner)();
    const return_value = {
        inputs: Object.fromEntries(await Promise.all(Object.entries(inputs).map(async ([label, pin_number])=>{
            const gpio_object = new (0, $RlZpy$Gpio)(pin_number, "in", "both");
            // set pull up resistor to down (motor protection input can't be read otherwise)
            const { stdout: stdout , stderr: stderr  } = await (0, $ba41cfbc3837684f$export$78e3044358792147)(`gpio -g mode ${pin_number} down`);
            if (stderr) (0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)(`Couldn't set pull up/down resistor for pin ${pin_number} (${label}), stdout: ${JSON.stringify(stdout)}, stderr: ${JSON.stringify(stderr)}`);
            const [accessor, setter] = (0, $RlZpy$createSignal)(await gpio_object.read());
            gpio_object.watch((failure, value)=>{
                if (failure) {
                    (0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)(`Error watching gpio pin ${pin_number} (${label})`, failure);
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
            const initial_value = (0, $RlZpy$untrack)(get_config).non_reactive_gpio_state_to_persist_program_restarts[label] ?? 1;
            const gpio_object = new (0, $RlZpy$Gpio)(pin_number, initial_value ? "high" : "low");
            const signal = (0, $RlZpy$createSignal)(initial_value);
            const [accessor] = signal;
            (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)(`Initialized GPIO pin ${pin_number} (${label}) with initial value: ${initial_value}`);
            (0, $f71a05d906dba8ec$export$c42cdf9e488a0697)(owner, (0, $RlZpy$on)(accessor, (0, $f71a05d906dba8ec$export$f241be8e610f5c77)(async (new_value)=>await gpio_object.write(new_value), `failed writing GPIO pin ${pin_number} (${label})`), {
                defer: true
            }));
            return [
                label,
                signal
            ];
        })))
    };
    (0, $RlZpy$runWithOwner)(owner, ()=>(0, $RlZpy$createEffect)(()=>{
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






function $132003e8f6e7d42a$export$95de40fe5a9b915b(gpio, get_config) {
    const thermometers = (0, $RlZpy$createMemo)(()=>get_config().thermometers);
    const thermometer_ids = (0, $RlZpy$createMemo)(()=>Object.keys(thermometers()));
    const reading_blocked = (0, $RlZpy$createSignal)(false);
    const [get_reading_blocked] = reading_blocked;
    const [get_temperature_sensor_power, set_temperature_sensor_power] = gpio.outputs.temperature_sensor_power;
    if ((0, $RlZpy$untrack)(get_temperature_sensor_power) === 0) {
        (0, $aef3f6d96f2300ed$export$c106dd0671a0fc2d)("Temperature sensor power relays was turned off, turning it on");
        set_temperature_sensor_power(1);
    }
    const thermometer_values = (0, $RlZpy$For)({
        get each () {
            if (get_reading_blocked()) return []; // Pretend there are no thermometers while reading is blocked so they don't get read
            return thermometer_ids();
        },
        children: (thermometer_device_id)=>// @ts-ignore
            $132003e8f6e7d42a$var$read_thermometer({
                thermometer_device_id: thermometer_device_id,
                label: (0, $RlZpy$createMemo)(()=>thermometers()[thermometer_device_id]),
                reading_blocked: reading_blocked,
                gpio: gpio
            })
    });
    const temperatures = (0, $RlZpy$createMemo)(()=>Object.fromEntries(thermometer_values()));
    return temperatures;
}
function $132003e8f6e7d42a$var$read_thermometer({ thermometer_device_id: thermometer_device_id , label: label , reading_blocked: [get_reading_blocked, set_reading_blocked] , gpio: gpio  }) {
    const [get_value, set_value] = (0, $RlZpy$createSignal)();
    const [get_fails, set_fails] = (0, $RlZpy$createSignal)(0);
    let got_cleanuped = false;
    (0, $RlZpy$onCleanup)(()=>got_cleanuped = true);
    (async ()=>{
        (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Starting reading of thermometer", thermometer_device_id, (0, $RlZpy$untrack)(label));
        while(!got_cleanuped){
            const fails = (0, $RlZpy$untrack)(get_fails);
            if (fails > 0) await (0, $f71a05d906dba8ec$export$5c069c93d2b7493f)(1000);
            else if (fails > 10) await (0, $f71a05d906dba8ec$export$5c069c93d2b7493f)(5000);
            try {
                const value = await $132003e8f6e7d42a$var$get_thermometer_value({
                    thermometer_device_id: thermometer_device_id,
                    label: label
                });
                set_value(value);
                set_fails(0);
            } catch (e) {
                (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)(`Failed reading thermometer ${thermometer_device_id} (${(0, $RlZpy$untrack)(label)}):`, e);
                set_fails((prev)=>prev + 1);
            }
        }
        (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Stopping reading of thermometer", thermometer_device_id, (0, $RlZpy$untrack)(label));
    })();
    (0, $RlZpy$createComputed)(async ()=>{
        const fails = get_fails();
        if (fails < 100 || (0, $RlZpy$untrack)(get_reading_blocked)) return;
        (0, $aef3f6d96f2300ed$export$c106dd0671a0fc2d)(`Over 100 fails (${fails}) for thermometer ${thermometer_device_id} (${(0, $RlZpy$untrack)(label)}), restarting all thermometers`);
        set_reading_blocked(true);
        const [, set_temperature_sensor_power] = gpio.outputs.temperature_sensor_power;
        set_temperature_sensor_power(0);
        (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Waiting 10s before turning thermometers back on");
        await (0, $f71a05d906dba8ec$export$5c069c93d2b7493f)(10000);
        set_temperature_sensor_power(1);
        (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Turned thermometers back on");
        set_fails(0);
        set_reading_blocked(false);
    });
    return [
        thermometer_device_id,
        get_value
    ];
}
async function $132003e8f6e7d42a$var$get_thermometer_value({ thermometer_device_id: thermometer_device_id , label: label  }) {
    const handle = await (0, $RlZpy$promises).open("/sys/bus/w1/devices/" + thermometer_device_id + "/w1_slave", "r");
    const read_contents = await handle.readFile({
        // example output: '84 01 55 05 7f a5 a5 66 f5 : crc=f5 YES\n84 01 55 05 7f a5 a5 66 f5 t=24250\n'
        encoding: "utf8"
    });
    const [line1, line2] = (read_contents || "").split("\n");
    const crc_line = line1?.split("crc=");
    const wanted_part = crc_line?.[crc_line?.length - 1];
    if (wanted_part?.split(" ")?.pop() !== "YES") throw new Error(`CRC didn't match for thermometer ${thermometer_device_id} (${(0, $RlZpy$untrack)(label)}): ` + read_contents);
    const temperature = +line2?.split("t=")?.pop() / 1000;
    if (temperature < -30 || temperature > 90 || isNaN(temperature)) throw new Error(`Temperature out of range for thermometer ${thermometer_device_id} (${(0, $RlZpy$untrack)(label)}): ` + temperature + "\xb0C");
    await handle.close();
    return {
        value: temperature,
        time: +new Date(),
        thermometer_device_id: thermometer_device_id,
        label: (0, $RlZpy$untrack)(label)
    };
}







const $a41dc16d236ad4a7$var$DATABASE = "mppsolar";
const $a41dc16d236ad4a7$var$TABLE = "frendebo_thermometers";
const $a41dc16d236ad4a7$var$database_import_file_header = `# DML
# CONTEXT-DATABASE: ${$a41dc16d236ad4a7$var$DATABASE}
# CONTEXT-RETENTION-POLICY: autogen
`;
function $a41dc16d236ad4a7$export$f05d541bee5eb917({ temperatures: temperatures , get_config: get_config  }) {
    // Write weighted average of temperatures every ~3s to a file to import into influx once MacMini is running again with Grafana and stuff
    const local_storage_file_name = (0, $RlZpy$path).dirname((0, $RlZpy$process).argv[1]) + "/../for_influx.txt";
    (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Using", local_storage_file_name, "as local log for temperatures");
    const file_handle = (0, $RlZpy$promises).open(local_storage_file_name, "a+").catch((e)=>(0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("Couldn't open local temperature log file", e));
    const keys = (0, $RlZpy$createMemo)(()=>Object.keys(temperatures()));
    (0, $RlZpy$For)({
        get each () {
            return keys();
        },
        children: (key)=>{
            const value_accessor = temperatures()[key];
            const values = new Set();
            let values_start = +new Date();
            (0, $RlZpy$createComputed)(()=>{
                const thermometer_object = value_accessor();
                if (!thermometer_object) return; // Unsure if this can happen but just in case
                values.add(thermometer_object);
                const now = +new Date();
                if (now - values_start >= (0, $RlZpy$untrack)(get_config).temperature_report_interval) {
                    const weighted_average = $a41dc16d236ad4a7$var$calculate_weighted_average({
                        values: values,
                        now: now
                    });
                    if (!isNaN(weighted_average)) // Don't report NaN averages when we got no data for a longer period
                    $a41dc16d236ad4a7$var$report_value({
                        averaged_value: weighted_average,
                        label: thermometer_object.label,
                        time: now,
                        file_handle: file_handle
                    }).catch((e)=>(0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("Couldn't write averaged temperature value to log", e));
                    values_start = now;
                }
            });
            return undefined;
        }
    });
}
async function $a41dc16d236ad4a7$var$report_value({ averaged_value: averaged_value , label: label , time: time , file_handle: file_handle  }) {
    const handle = await file_handle;
    if (!handle) return;
    const buf = Buffer.alloc($a41dc16d236ad4a7$var$database_import_file_header.length);
    await handle.read(buf, 0, $a41dc16d236ad4a7$var$database_import_file_header.length, 0);
    const current_header_of_file = String(buf);
    if (current_header_of_file !== $a41dc16d236ad4a7$var$database_import_file_header) await handle.write($a41dc16d236ad4a7$var$database_import_file_header);
    await handle.write(`${$a41dc16d236ad4a7$var$TABLE} ${label}=${averaged_value} ${Math.round(time / 1000)}\n`);
}
function $a41dc16d236ad4a7$var$calculate_weighted_average({ values: values , now: now  }) {
    const values_as_array = [
        ...values
    ];
    let weighted_sum = 0;
    let duration_sum = 0;
    for(let i = 0; i < values_as_array.length; i++){
        const this_value = values_as_array[i];
        const next_value = values_as_array[i + 1];
        const duration_of_value = (next_value?.time ?? now) - this_value.time;
        weighted_sum += duration_of_value * this_value.value;
        duration_sum += duration_of_value;
    }
    values.clear();
    const weighted_average = weighted_sum / duration_sum;
    return weighted_average;
}










let $3e2d65e5b5aaaa67$var$is_taking_picture = false;
async function $3e2d65e5b5aaaa67$export$89891446eaeebb97() {
    while(true){
        await $3e2d65e5b5aaaa67$export$7103773c48bdc4b7();
        await (0, $f71a05d906dba8ec$export$5c069c93d2b7493f)(1800000); // take picture every 30 minutes
    }
}
async function $3e2d65e5b5aaaa67$export$7103773c48bdc4b7(repeat_in_seconds = []) {
    try {
        if ($3e2d65e5b5aaaa67$var$is_taking_picture) return;
        $3e2d65e5b5aaaa67$var$is_taking_picture = true;
        const folder_path = (0, $RlZpy$path).dirname((0, $RlZpy$process).argv[1]) + "/../images/";
        await (0, $RlZpy$promises).mkdir(folder_path, {
            recursive: true
        });
        const target_filename = folder_path + new Date().toISOString() + ".jpg";
        const { stdout: stdout , stderr: stderr  } = await (0, $ba41cfbc3837684f$export$78e3044358792147)("raspistill -o " + JSON.stringify(target_filename));
        if (stdout || stderr) (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Probably took picture. stdout:", stdout, "stderr:", stderr);
        const [next_time, ...rest_of_minutes] = repeat_in_seconds;
        if (next_time != undefined) setTimeout(()=>$3e2d65e5b5aaaa67$export$7103773c48bdc4b7(rest_of_minutes), next_time * 1000);
    } catch (e) {
        (0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("Error taking picture", e);
    } finally{
        $3e2d65e5b5aaaa67$var$is_taking_picture = false;
    }
}



const $dd32114ccf3c9e24$var$feed_log = (...stuff)=>(0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Feeder switching:", ...stuff);
function $dd32114ccf3c9e24$export$b6b0d378eb7ffcba({ inputs: inputs , outputs: outputs  }, config_signal) {
    const [get_pellets_feeder_motor, set_pellets_feeder_motor] = outputs.pellets_feeder_motor;
    const [get_config, set_config] = config_signal;
    const protection_triggered = (0, $RlZpy$createMemo)(()=>get_config().feeder_protection_triggered);
    const lower_empty = (0, $RlZpy$createMemo)(()=>inputs.pellets_chamber_lower_sensor() === 1);
    const upper_empty = (0, $RlZpy$createMemo)(()=>inputs.pellets_chamber_upper_sensor() === 1);
    const feeding_max_time = 600000; // 10 minutes
    (0, $RlZpy$createEffect)(()=>{
        potential_switching: {
            // protection checks
            if (protection_triggered()) {
                (0, $aef3f6d96f2300ed$export$c106dd0671a0fc2d)("Feeder motor protection has been triggered (according to config file), please check that the motor is unobstructured before resetting the value. Will not feed.");
                set_pellets_feeder_motor(1);
                break potential_switching;
            }
            if (inputs.motor_protection_triggered() === 0) {
                // it is 1 when triggered
                (0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("Feeder motor protection just triggered!!! Turning of feeder relays and writing to config. Please check the motor.");
                set_pellets_feeder_motor(1);
                set_config((prev)=>({
                        ...prev,
                        feeder_protection_triggered: true
                    }));
                (0, $3e2d65e5b5aaaa67$export$7103773c48bdc4b7)();
                break potential_switching;
            }
            $dd32114ccf3c9e24$var$do_switching({
                lower_empty: lower_empty,
                upper_empty: upper_empty,
                pellets_feeder_motor: outputs.pellets_feeder_motor
            });
            return;
        }
        // If we get here, we've bailed out of feeding. Still write GPIO values to log
        (0, $RlZpy$createComputed)(()=>(0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Feeding disabled. Lower sensor value now " + (lower_empty() ? "empty" : "full")));
        (0, $RlZpy$createComputed)(()=>(0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Feeding disabled. Upper sensor value now " + (upper_empty() ? "empty" : "full")));
    });
    // Protect against pellets feeder motor running for too long, either because it was manually turned on or turned on by the sensors
    let feeder_timeout;
    let feeder_started_at;
    (0, $RlZpy$createEffect)(()=>{
        if (get_pellets_feeder_motor() === 0) {
            // We're feeding
            feeder_started_at = +new Date();
            feeder_timeout = setTimeout((0, $f71a05d906dba8ec$export$fe8f1dea867b3946)(()=>{
                if (!get_pellets_feeder_motor()) return;
                const duration = +new Date() - feeder_started_at;
                $dd32114ccf3c9e24$var$feed_log(`We have been feeding for longer than 10 minutes (${duration}ms, which is ${duration / 1000 / 60}minutes). Triggering motor protection and stopping to feed because something certainly is wrong.`);
                set_pellets_feeder_motor(1);
                set_config((prev)=>({
                        ...prev,
                        feeder_protection_triggered: true
                    }));
            }), feeding_max_time);
        } else {
            clearTimeout(feeder_timeout);
            feeder_started_at = undefined;
        }
    });
}
function $dd32114ccf3c9e24$var$do_switching({ lower_empty: get_lower_empty , upper_empty: get_upper_empty , pellets_feeder_motor: [get_pellets_feeder_motor, set_pellets_feeder_motor]  }) {
    const lower_empty = get_lower_empty();
    const upper_empty = get_upper_empty();
    const feeding = (0, $RlZpy$untrack)(get_pellets_feeder_motor) === 0;
    if (lower_empty && upper_empty) {
        $dd32114ccf3c9e24$var$feed_log("Both sensors report empty, starting to feed");
        set_pellets_feeder_motor(0);
        (0, $3e2d65e5b5aaaa67$export$7103773c48bdc4b7)([
            10,
            30,
            60,
            120,
            300,
            600
        ]);
    } else if (!upper_empty && lower_empty) {
        $dd32114ccf3c9e24$var$feed_log("Super strange situation, lower sensor reports empty but upper does not (shouldn't be the case due to gravity), assuming human interference");
        (0, $3e2d65e5b5aaaa67$export$7103773c48bdc4b7)([
            10,
            30,
            60,
            120,
            300,
            600
        ]);
    } else if (!lower_empty && upper_empty) {
        if (feeding) {
            $dd32114ccf3c9e24$var$feed_log("Lower sensor now has pellets again");
            (0, $3e2d65e5b5aaaa67$export$7103773c48bdc4b7)([
                10,
                30,
                60,
                120,
                300,
                600
            ]);
        } else {
            $dd32114ccf3c9e24$var$feed_log("Upper sensor reports empty, will probably need pellets soon (waiting for lower one to empty)");
            (0, $3e2d65e5b5aaaa67$export$7103773c48bdc4b7)([
                10,
                30,
                60,
                120,
                300,
                600
            ]);
        }
    } else if (!lower_empty && !upper_empty) {
        if (feeding) {
            // Only log when actually on but still try to turn off just in case
            $dd32114ccf3c9e24$var$feed_log("Both sensors report full, stopping feeder");
            (0, $3e2d65e5b5aaaa67$export$7103773c48bdc4b7)([
                10,
                30,
                60,
                120,
                300,
                600
            ]);
        }
        set_pellets_feeder_motor(1);
    }
}






async function $26d5ecc00e955fbe$export$ed8c5e72bb4752bb() {
    const router_ip = "192.168.178.1"; // not having this in config since airbnb guests might mess with the config and then the pi could be unreachable
    while(true){
        const attempt = await (0, $RlZpy$ping).promise.probe(router_ip, {
            timeout: 10,
            min_reply: 4
        }).catch((e)=>(0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Error pinging router at " + router_ip, e));
        if (attempt) {
            if (!attempt.alive) {
                (0, $aef3f6d96f2300ed$export$c106dd0671a0fc2d)("VPN or internet is probably down. Restarting VPN", attempt);
                let stdout;
                let stderr;
                try {
                    ({ stdout: stdout , stderr: stderr  } = await (0, $ba41cfbc3837684f$export$78e3044358792147)("sudo systemctl restart fritzbox.service"));
                } catch (e) {
                    stderr = e;
                }
                if (stderr) (0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("Error restarting VPN. ", stderr, "stdout:", stdout);
                if (stdout) (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("VPN restarted. stdout:", stdout);
                await (0, $f71a05d906dba8ec$export$5c069c93d2b7493f)(10000); // give some extra time to attempt a reconnection
            }
        }
        await (0, $f71a05d906dba8ec$export$5c069c93d2b7493f)(10000);
    }
}







const $1fba249fbe71e0a6$var$max_connection_age = 3600000; //ms
const $1fba249fbe71e0a6$var$ping_interval = 5000; // ms
const $1fba249fbe71e0a6$var$port = 9321;
const $1fba249fbe71e0a6$var$connections = new Set();
async function $1fba249fbe71e0a6$export$951c2e5e535c1889(handle_message) {
    let wss;
    const start_server = ()=>{
        wss = new (0, $RlZpy$WebSocketServer)({
            port: $1fba249fbe71e0a6$var$port
        });
        wss.on("error", (0, $f71a05d906dba8ec$export$fe8f1dea867b3946)(async (e)=>{
            (0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("WS server had an error", e, "restarting it in 5s");
            wss.close();
            await (0, $f71a05d906dba8ec$export$5c069c93d2b7493f)(5000);
            start_server();
        }));
        wss.on("connection", (0, $f71a05d906dba8ec$export$fe8f1dea867b3946)(async (ws)=>{
            $1fba249fbe71e0a6$var$connections.add(ws);
            let last_movement = +new Date();
            ws.on("close", ()=>last_movement = 0);
            ws.on("error", (0, $f71a05d906dba8ec$export$fe8f1dea867b3946)((m)=>{
                (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Connection had error, killing it", m);
                last_movement = 0;
            }));
            ws.on("pong", ()=>last_movement = +new Date());
            ws.on("message", (0, $f71a05d906dba8ec$export$fe8f1dea867b3946)(async (data)=>{
                const decoded = JSON.parse(data.toString());
                if (!decoded.id) {
                    (0, $aef3f6d96f2300ed$export$c106dd0671a0fc2d)("Cannot handle message", decoded, data, "because it doesn't have an id");
                    return;
                }
                ws.send(JSON.stringify({
                    id: decoded.id,
                    status: "ack"
                }));
                const response = await handle_message(decoded);
                if (response) ws.send(response);
            }));
            while(+new Date() - last_movement < $1fba249fbe71e0a6$var$max_connection_age){
                ws.ping(Math.random() + "");
                await (0, $f71a05d906dba8ec$export$5c069c93d2b7493f)($1fba249fbe71e0a6$var$ping_interval);
            }
            ws.close();
            $1fba249fbe71e0a6$var$connections.delete(ws);
        }));
        (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Started websocket server");
    };
    start_server();
    const broadcast = (0, $f71a05d906dba8ec$export$fe8f1dea867b3946)((msg)=>{
        for (const connection of $1fba249fbe71e0a6$var$connections)connection.send(msg);
    });
    return {
        broadcast: broadcast
    };
}




async function $6437fbdf99378d88$export$b5b89ed5e6f7f426({ config_signal: [get_config, set_config] , gpio: gpio , voltage_signal: [get_voltage] , get_pid_output: get_pid_output , owner: owner , temperatures: temperatures  }) {
    const exposed_signals = {
        config: {
            getter: get_config,
            setter: set_config,
            validator: (value)=>{
                if (typeof value !== "object") return "Can't write config, not an object: " + value;
            }
        },
        voltage: {
            getter: get_voltage
        },
        gpio: {
            getter: ()=>$6437fbdf99378d88$var$serialize_gpio(gpio)
        },
        pid_output: {
            getter: get_pid_output
        },
        temperatures: {
            getter: ()=>$6437fbdf99378d88$var$serialize_temperatures(temperatures)
        }
    };
    const { broadcast: broadcast  } = await (0, $1fba249fbe71e0a6$export$951c2e5e535c1889)(async (msg)=>{
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
            (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)(`Setting GPIO ${JSON.stringify(output)} to ${JSON.stringify(new_state)} due to WS message`);
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
                value: (0, $RlZpy$untrack)(()=>getter())
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
        (0, $f71a05d906dba8ec$export$c42cdf9e488a0697)(owner, ()=>broadcast(JSON.stringify({
                id: Math.random() + "",
                type: "change",
                key: key,
                "value": getter()
            })));
    }
}
function $6437fbdf99378d88$var$serialize_gpio(gpio) {
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
function $6437fbdf99378d88$var$serialize_temperatures(temperatures) {
    return Object.fromEntries(Object.entries(temperatures()).map(([device_id, value])=>[
            device_id,
            value()
        ]));
}










const $ba9909a8a8581dda$var$max_output_voltage = 10; // volts
function $ba9909a8a8581dda$export$193b420496cc09ea({ temperatures: temperatures , gpio: { outputs: { stove: [get_stove_on, set_stove_on]  }  } , config: [get_config] , voltage_signal: voltage_signal , set_pid_output: set_pid_output , temperature_gradient_ref: temperature_gradient_ref  }) {
    const is_disabled = (0, $RlZpy$createMemo)(()=>get_config().stove_disabled);
    const turn_on_at_temperature = (0, $RlZpy$createMemo)(()=>get_config().turn_stove_on_at);
    const turn_off_at_temperature = (0, $RlZpy$createMemo)(()=>get_config().turn_stove_off_at);
    const current_temperature = (0, $RlZpy$createMemo)(()=>{
        const sensor_name = get_config().pid_control.input_sensor;
        for (const temperature_accessor of Object.values(temperatures())){
            const temperature = temperature_accessor();
            if (temperature?.label === sensor_name) return temperature.value;
        }
    });
    $ba9909a8a8581dda$var$pid_controller({
        get_config: get_config,
        set_pid_output: set_pid_output,
        voltage_signal: voltage_signal,
        current_temperature: current_temperature
    });
    const temperature_gradient = $ba9909a8a8581dda$var$get_temperature_gradient(current_temperature);
    temperature_gradient_ref?.(temperature_gradient);
    const owner = (0, $RlZpy$getOwner)();
    (async ()=>{
        const log_file_name = (0, $RlZpy$path).dirname((0, $RlZpy$process).argv[1]) + "/../gradient.txt";
        const file_handle = await (0, $RlZpy$promises).open(log_file_name, "a+");
        (0, $f71a05d906dba8ec$export$c42cdf9e488a0697)(owner, async ()=>{
            await file_handle.write(`${new Date().toISOString()} ${temperature_gradient()}deg\n`);
        });
    })();
    (0, $RlZpy$createEffect)(()=>{
        if (is_disabled()) {
            if (get_stove_on() === 0) (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Turning off stove due to config setting", (0, $RlZpy$untrack)(get_config));
            set_stove_on(1);
            return;
        }
        const temperature = current_temperature();
        if (temperature === undefined) return;
        if (temperature === 0) {
            (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Temperature is 0 for some reason, not turning on stove");
            return;
        }
        if (temperature < turn_on_at_temperature()) {
            if (get_stove_on() === 1) {
                (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)(`Temperature is less than ${turn_on_at_temperature()}°C (${temperature}°C), turning on stove`);
                (0, $3e2d65e5b5aaaa67$export$7103773c48bdc4b7)([
                    30,
                    960
                ]); // takes 15 minutes to start up, so take a picture now, in 30s and 16 minutes
            }
            set_stove_on(0);
        } else if (temperature > turn_off_at_temperature()) {
            if (get_stove_on() === 0) {
                (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)(`Temperature is more than ${turn_off_at_temperature()}°C (${temperature}°C), turning off stove`);
                (0, $3e2d65e5b5aaaa67$export$7103773c48bdc4b7)([
                    30,
                    960
                ]); // takes 15 minutes to shut down, so take a picture now, in 30s and 16 minutes
            }
            set_stove_on(1);
        }
    });
}
function $ba9909a8a8581dda$var$get_temperature_gradient(current_temperature) {
    const [get_gradient, set_gradient] = (0, $RlZpy$createSignal)();
    let last_temperature;
    let last_time;
    (0, $RlZpy$createComputed)(()=>{
        const temperature = current_temperature();
        if (temperature == undefined) return;
        const now = +new Date();
        if (last_temperature != undefined) {
            const delta_T = temperature - last_temperature;
            const delta_t = now - last_time;
            const gradient = Math.atan(delta_T / delta_t) * (180 / Math.PI);
            set_gradient(gradient);
        }
        last_temperature = temperature;
        last_time = now;
    });
    return get_gradient;
}
/*
 calculates and sets power
 */ function $ba9909a8a8581dda$var$pid_controller({ get_config: get_config , set_pid_output: report_pid_output_to_above , voltage_signal: [, set_voltage] , current_temperature: current_temperature  }) {
    const [pid_output, set_pid_output] = (0, $RlZpy$createSignal)(0);
    const k_p = (0, $RlZpy$createMemo)(()=>get_config().pid_control.k_p);
    const k_d = (0, $RlZpy$createMemo)(()=>get_config().pid_control.k_d);
    const k_i = (0, $RlZpy$createMemo)(()=>get_config().pid_control.k_i);
    const i_max = (0, $RlZpy$createMemo)(()=>get_config().pid_control.i_max);
    const pid_100_percent_value = (0, $RlZpy$createMemo)(()=>get_config().pid_control.pid_100_percent_value);
    const target_temperature = (0, $RlZpy$createMemo)(()=>get_config().pid_control.target_temperature);
    const controller = new (0, $RlZpy$nodepidcontroller)({
        k_p: (0, $RlZpy$untrack)(k_p),
        k_i: (0, $RlZpy$untrack)(k_i),
        k_d: (0, $RlZpy$untrack)(k_d),
        i_max: (0, $RlZpy$untrack)(i_max)
    });
    (0, $RlZpy$createComputed)(()=>controller.k_p = k_p());
    (0, $RlZpy$createComputed)(()=>controller.k_i = k_i());
    (0, $RlZpy$createComputed)(()=>controller.k_d = k_d());
    (0, $RlZpy$createComputed)(()=>controller.i_max = i_max());
    (0, $RlZpy$createComputed)(()=>controller.setTarget(target_temperature()));
    (0, $RlZpy$createComputed)(()=>{
        const current = current_temperature();
        if (current === undefined) return;
        const pid_factor = controller.update(current);
        set_pid_output(pid_factor);
        report_pid_output_to_above(pid_factor);
    });
    // set voltage
    (0, $RlZpy$createEffect)(()=>{
        const factor = pid_100_percent_value() / $ba9909a8a8581dda$var$max_output_voltage;
        const raw_pid_value = pid_output();
        if (raw_pid_value < 0 || isNaN(raw_pid_value)) {
            set_voltage(0);
            return;
        }
        const target_voltage = raw_pid_value / factor;
        if (target_voltage > 11) {
            set_voltage(10);
            return;
        }
        set_voltage(target_voltage);
    });
}






async function $505544749cf2526e$export$9434fbcaa0056b8d({ owner: owner  }) {
    const dcdc_regulator = await new (0, $RlZpy$DCDC)({
        baudRate: 9600,
        prefix: ":",
        portId: "/dev/ttyS0"
    });
    const voltage_signal = (0, $RlZpy$createSignal)(await dcdc_regulator?.getVoltage());
    const [get_voltage, set_voltage] = voltage_signal;
    if (!dcdc_regulator) {
        (0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("Could not initialize DCDC regulator, won't be able to control power");
        return voltage_signal;
    }
    const interval = setInterval((0, $f71a05d906dba8ec$export$fe8f1dea867b3946)(async ()=>set_voltage(await dcdc_regulator.getVoltage()), "error polling for voltage"), 10000);
    (0, $RlZpy$runWithOwner)(owner, ()=>{
        (0, $RlZpy$onCleanup)(()=>clearInterval(interval));
        (0, $RlZpy$createEffect)(()=>dcdc_regulator.setVoltage(get_voltage()));
    });
    return voltage_signal;
}








async function $d339b1ec24f2c035$export$43e42c553e9f0276({ get_config: get_config , temperatures: temperatures , gpio: gpio , get_pid_output: get_pid_output , voltage_signal: [get_voltage] , owner: owner , temperature_gradient: temperature_gradient  }) {
    const log_file_name = (0, $RlZpy$path).dirname((0, $RlZpy$process).argv[1]) + "/../evaluation_log.csv";
    const file_handle = await (0, $RlZpy$promises).open(log_file_name, "a+");
    (0, $RlZpy$runWithOwner)(owner, ()=>{
        const current_temperature = (0, $RlZpy$createMemo)(()=>{
            const sensor_name = get_config().pid_control.input_sensor;
            for (const temperature_accessor of Object.values(temperatures())){
                const temperature = temperature_accessor();
                if (temperature?.label === sensor_name) return temperature.value;
            }
        });
        const stove_status = (0, $RlZpy$createMemo)(()=>gpio.outputs.stove[0]() === 1 ? "off" : "on");
        const pid_control_values = (0, $RlZpy$createMemo)(()=>{
            const obj = {
                ...get_config().pid_control
            };
            // @ts-ignore
            delete obj["input_sensor"];
            return Object.values(obj).join(",");
        });
        (0, $aef3f6d96f2300ed$export$bef1f36f5486a6a3)("Logging evaluation data to", log_file_name);
        // time,current_temperature,stove_status,pid_output,voltage,target_temperature,k_p,k_i,k_d,i_max,pid_100_percent_value,temperature_gradient
        (0, $RlZpy$createComputed)((0, $f71a05d906dba8ec$export$fe8f1dea867b3946)(async ()=>await file_handle.write(`${new Date().toISOString()},${current_temperature()},${stove_status()},${get_pid_output()},${get_voltage()},${pid_control_values()},${temperature_gradient()}\n`)));
    });
}


(0, $RlZpy$createRoot)($755f37e2cd338b77$var$main);
async function $755f37e2cd338b77$var$main() {
    const owner = (0, $RlZpy$getOwner)();
    // TODO:
    // switch elpatron
    // bath mode
    // print dt for PID controller tuning
    // - Add bad value ignorer
    // - Start PID controller later
    const [get_pid_output, set_pid_output] = (0, $RlZpy$createSignal)();
    const config_signal = await (0, $100ff35390bdcc97$export$63203fc43b45b793)(owner);
    const [get_config] = config_signal;
    const gpio = await (0, $RlZpy$runWithOwner)(owner, ()=>(0, $99bf9651739769b1$export$90ed46c0f5657f4f)(config_signal));
    (0, $RlZpy$runWithOwner)(owner, ()=>(0, $dd32114ccf3c9e24$export$b6b0d378eb7ffcba)(gpio, config_signal));
    const voltage_signal = await (0, $505544749cf2526e$export$9434fbcaa0056b8d)({
        owner: owner
    });
    const temperatures = (0, $RlZpy$runWithOwner)(owner, ()=>(0, $132003e8f6e7d42a$export$95de40fe5a9b915b)(gpio, get_config));
    let temperature_gradient;
    await (0, $6437fbdf99378d88$export$b5b89ed5e6f7f426)({
        config_signal: config_signal,
        gpio: gpio,
        voltage_signal: voltage_signal,
        get_pid_output: get_pid_output,
        owner: owner,
        temperatures: temperatures
    });
    (0, $RlZpy$runWithOwner)(owner, ()=>(0, $a41dc16d236ad4a7$export$f05d541bee5eb917)({
            temperatures: temperatures,
            get_config: get_config
        }));
    (0, $RlZpy$runWithOwner)(owner, ()=>(0, $ba9909a8a8581dda$export$193b420496cc09ea)({
            temperatures: temperatures,
            gpio: gpio,
            config: config_signal,
            voltage_signal: voltage_signal,
            set_pid_output: set_pid_output,
            temperature_gradient_ref: (grad)=>temperature_gradient = grad
        }));
    (0, $3e2d65e5b5aaaa67$export$89891446eaeebb97)().catch((e)=>(0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("Picture taker failed", e));
    (0, $d339b1ec24f2c035$export$43e42c553e9f0276)({
        gpio: gpio,
        get_config: get_config,
        get_pid_output: get_pid_output,
        temperatures: temperatures,
        voltage_signal: voltage_signal,
        owner: owner,
        temperature_gradient: temperature_gradient
    }).catch((e)=>(0, $aef3f6d96f2300ed$export$a3bc9b8ed74fc)("Evaluation logger failed", e));
    await (0, $26d5ecc00e955fbe$export$ed8c5e72bb4752bb)(); // code after this await won't execute
}


