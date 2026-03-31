import type { ClaimSet, CredentialConfiguration, Jwk } from "@vidos-id/issuer";
import type { TokenStatusLabel } from "@vidos-id/issuer-web-shared";
import {
	getTokenStatusLabel,
	KNOWN_TOKEN_STATUSES,
} from "@vidos-id/issuer-web-shared";

export function jsonParse<T>(value: string): T {
	return JSON.parse(value) as T;
}

export function asIsoString(value: Date) {
	return value.toISOString();
}

export function now() {
	return new Date();
}

export function buildCredentialConfiguration(
	credentialConfigurationId: string,
	vct: string,
): Record<string, CredentialConfiguration> {
	return {
		[credentialConfigurationId]: {
			format: "dc+sd-jwt",
			vct,
			scope: credentialConfigurationId,
		},
	};
}

export function mergeClaims(
	baseClaims: ClaimSet,
	overrideClaims?: ClaimSet,
): ClaimSet {
	return {
		...baseClaims,
		...(overrideClaims ?? {}),
	};
}

export function buildStatusLabel(status: number): TokenStatusLabel {
	return getTokenStatusLabel(status as 0 | 1 | 2) as TokenStatusLabel;
}

export function isKnownStatus(status: number) {
	return KNOWN_TOKEN_STATUSES.includes(status as 0 | 1 | 2);
}

export function parseJwk(json: string) {
	return jsonParse<Jwk>(json);
}
