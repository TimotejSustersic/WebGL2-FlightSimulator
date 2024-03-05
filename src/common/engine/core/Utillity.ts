export function stringify(value: number): string {
        
    return String(Math.round(value * 10) / 10);
}

export function setExtremeValues(value: number, max: number, min?: number): number {

    value = Math.max(value, min ?? -max);
    value = Math.min(value, max);

    return value;
}

export function showHTML(container: HTMLElement): void {
    container.style.display = "block";
}
export function hideHTML(container: HTMLElement): void {
    container.style.display = "none";
}