import { mount } from 'svelte'
import App from './App.svelte'

const app = mount(App, {
    target: document.getElementById('app')!,
})

export interface Result {
    A: string;
    B: string;
    sim: number;
}

export function generateShortId(): string {
    return Math.random().toString(36).substring(2, 7);
}

export default app
