export function arraysEqual(left, right) {
  return left.length === right.length &&
    left.every((item, index) => item === right[index]);
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function hasExactKeys(value, expected) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return arraysEqual(Object.keys(value).sort(), [...expected].sort());
}
