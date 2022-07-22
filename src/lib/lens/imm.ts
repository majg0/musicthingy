import { get, type Lens } from '.';

export function set<O, V>(lens: Lens<O, V>, v: V, o: O): O {
	return lens[1](o, v);
}

export function update<O, V>(lens: Lens<O, V>, f: (v: V) => V, o: O): O {
	return set(lens, f(get(lens, o)), o);
}
