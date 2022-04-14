/**
 * Computes value for a variable label depending on value of `maskedValues`.
 *
 * @param value Variable value
 * @param maskedValues True to masks the value.
 * @returns When `maskedValues` is true then it returns series of `•`.
 * The input otherwise.
 */
export function variableValueLabel(value: string, maskedValues: boolean): string {
  if (!value) {
    return '(empty)';
  }
  if (maskedValues) {
    const len = value.length;
    const arr = new Array(len);
    return arr.fill('•', 0, len).join('');
  }
  return value;
}
