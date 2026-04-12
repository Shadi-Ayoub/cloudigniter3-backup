async function getContent(name: string) {
  try {
    const data = await import(`./data/${name}.json`, {
      assert: { type: 'json' },
    });
    return data.default; // JSON modules are stored under .default
  } catch (error) {
    throw new Error('Error loading JSON file');
  }
}

export { getContent };
