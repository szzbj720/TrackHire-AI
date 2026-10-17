import "dotenv/config";

import {
  runFactoryDeliveryCli,
} from "./factory-delivery-cli.js";

async function main():
  Promise<void> {
  try {
    await runFactoryDeliveryCli(
      process.argv.slice(2),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      `Factory delivery failed: ${message}`,
    );

    process.exitCode =
      1;
  }
}

await main();