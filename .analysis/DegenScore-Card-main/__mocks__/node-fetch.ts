export default jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({ success: true, whales: [], alerts: [] }) })
);
