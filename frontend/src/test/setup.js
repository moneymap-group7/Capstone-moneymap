import '@testing-library/jest-dom';
Object.defineProperty(global, "localStorage", {
  value: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
});
