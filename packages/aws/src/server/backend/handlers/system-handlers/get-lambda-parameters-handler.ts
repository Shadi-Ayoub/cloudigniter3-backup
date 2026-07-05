export const ciGetLambdaParametersHandler = async (event: { arguments: {} }, context: unknown) => {
  const start = performance.now();

  return {
    event,
    context,
    env: process.env,
    executionDuration: performance.now() - start,
  };
};
