// Example: await sleep(3000); // Simulate a delay of 3 seconds
export function ciSleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
