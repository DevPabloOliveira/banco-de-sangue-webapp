export const hash    = jest.fn(async p => `hash(${p})`);
export const compare = jest.fn(async (p,h) => h === `hash(${p})`);
export default { hash, compare };
