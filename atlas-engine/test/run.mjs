// node atlas-engine/test/run.mjs
import { runTests } from "./engine.test.js";

try {
  const passed = runTests();
  for (const name of passed) console.log(`ok  ${name}`);
  console.log(`\n${passed.length} passed`);
} catch (e) {
  console.error(`FAIL  ${e.message}`);
  process.exit(1);
}
