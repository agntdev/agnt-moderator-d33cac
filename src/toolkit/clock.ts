/** Injectable clock shared by schedules and moderation decisions. */
let source = () => Date.now();
export const now = () => source();
export const setClockForTests = (value?: () => number) => { source = value ?? (() => Date.now()); };
