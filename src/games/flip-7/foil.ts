/** Foil colours, cycled to give each player and each number card its own wrapper. */
export const FOILS = ['ruby', 'emerald', 'sapphire', 'magenta', 'tangerine', 'gold'] as const;
export type Foil = (typeof FOILS)[number];

export const foilVar = (f: Foil) => `var(--f7-${f})`;
export const playerFoil = (i: number) => foilVar(FOILS[i % FOILS.length]);
export const numberFoil = (n: number) => foilVar(FOILS[n % FOILS.length]);
