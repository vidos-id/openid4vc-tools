#!/usr/bin/env node

import { handleCliError } from "@vidos-id/openid4vc-cli-common";
import { runCli } from "./index.ts";

void runCli().catch((error) => {
	handleCliError(error);
});
