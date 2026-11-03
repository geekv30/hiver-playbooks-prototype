// The layouts for the Trigger's start choice (see TriggerStart). A plain module,
// not a client one, so server pages (the option routes) can read the list.
export type StartUi = 'tabs' | 'blocks' | 'radio' | 'chips';
export const START_UIS: StartUi[] = ['tabs', 'blocks', 'radio', 'chips'];
export const isStartUi = (v: string | null | undefined): v is StartUi => START_UIS.includes(v as StartUi);
