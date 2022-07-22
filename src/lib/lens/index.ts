import * as Imm from './imm';
import * as Mut from './mut';

export * as Imm from './imm';
export * as Mut from './mut';

export type LensGet<O, V> = (o: O) => V;

// Yes these are the same and should be newtyped.
export type LensImmutableSet<O, V> = (o: O, v: V) => O;
export type LensMutableSet<O, V> = (o: O, v: V) => O;

export type Lens<O, V> = [LensGet<O, V>, LensImmutableSet<O, V>, LensMutableSet<O, V>];

export function array<V>(k: number, v0: V): Lens<V[], V> {
	return [
		(o) => o[k] ?? v0,
		(o, v) => {
			const copy = o.slice();
			copy.splice(k, 1, v);
			return copy;
		},
		(o, v) => {
			o[k] = v;
			return o;
		}
	];
}

export function object<O>() {
	return <K1 extends keyof O>(k: K1): Lens<O, O[K1]> => [
		(o) => o[k],
		(o, v) => ({ ...o, [k]: v }),
		(o, v) => {
			o[k] = v;
			return o;
		}
	];
}

export function object2<O>() {
	return <K1 extends keyof O, K2 extends keyof O[K1]>([k1, k2]: [K1, K2]): Lens<O, O[K1][K2]> => [
		(o) => o[k1][k2],
		(o, v) => ({ ...o, [k1]: { ...o[k1], [k2]: v } }),
		(o, v) => {
			o[k1][k2] = v;
			return o;
		}
	];
}

export function object3<O>() {
	return <K1 extends keyof O, K2 extends keyof O[K1], K3 extends keyof O[K1][K2]>([k1, k2, k3]: [
		K1,
		K2,
		K3
	]): Lens<O, O[K1][K2][K3]> => [
		(o) => o[k1][k2][k3],
		(o, v) => ({ ...o, [k1]: { ...o[k1], [k2]: { ...o[k1][k2], [k3]: v } } }),
		(o, v) => {
			o[k1][k2][k3] = v;
			return o;
		}
	];
}

export function object4<O>() {
	return <
		K1 extends keyof O,
		K2 extends keyof O[K1],
		K3 extends keyof O[K1][K2],
		K4 extends keyof O[K1][K2][K3]
	>([k1, k2, k3, k4]: [K1, K2, K3, K4]): Lens<O, O[K1][K2][K3][K4]> => [
		(o) => o[k1][k2][k3][k4],
		(o, v) => ({
			...o,
			[k1]: { ...o[k1], [k2]: { ...o[k1][k2], [k3]: { ...o[k1][k2][k3], [k4]: v } } }
		}),
		(o, v) => {
			o[k1][k2][k3][k4] = v;
			return o;
		}
	];
}

export function map<V>() {
	return <K>(k: K, v0: V): Lens<Map<K, V>, V> => [
		(o) => o.get(k) ?? v0,
		(o, v) => new Map(o).set(k, v),
		(o, v) => o.set(k, v)
	];
}

export function get<O, V>(lens: Lens<O, V>, o: O): V {
	return lens[0](o);
}

export function compose<O, T, V>(l0: Lens<O, T>, l1: Lens<T, V>): Lens<O, V> {
	return [
		(o) => get(l1, get(l0, o)),
		(o, v) => Imm.update(l0, (t) => Imm.set(l1, v, t), o),
		(o, v) => Mut.update(l0, (t) => Mut.set(l1, v, t), o)
	];
}
