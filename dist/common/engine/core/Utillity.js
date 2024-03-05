export function stringify(value) {
    return String(Math.round(value * 10) / 10);
}
export function setExtremeValues(value, max, min) {
    value = Math.max(value, min ?? -max);
    value = Math.min(value, max);
    return value;
}
export function showHTML(container) {
    container.style.display = "block";
}
export function hideHTML(container) {
    container.style.display = "none";
}
//# sourceMappingURL=Utillity.js.map