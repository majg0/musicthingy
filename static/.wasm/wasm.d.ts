/* tslint:disable */
/* eslint-disable */
/**
* @param {number} sample_rate
* @param {number} buffer_size
* @returns {number}
*/
export function initialize(sample_rate: number, buffer_size: number): number;
/**
*/
export function process(): void;
/**
* @returns {any}
*/
export function getSettings(): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly initialize: (a: number, b: number) => number;
  readonly process: () => void;
  readonly getSettings: () => number;
}

/**
* Synchronously compiles the given `bytes` and instantiates the WebAssembly module.
*
* @param {BufferSource} bytes
*
* @returns {InitOutput}
*/
export function initSync(bytes: BufferSource): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
