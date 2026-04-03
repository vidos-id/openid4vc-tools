import {
	type OpenId4VpRequestInput,
	OpenId4VpRequestSchema,
} from "../schemas.ts";
import type { CreatePresentationResult } from "../wallet.ts";

export type OpenId4VpAuthorizationResponse = {
	vp_token: string;
	state?: string;
};

export function createOpenId4VpAuthorizationResponse(
	request: OpenId4VpRequestInput,
	presentation: CreatePresentationResult,
): OpenId4VpAuthorizationResponse {
	const parsedRequest = OpenId4VpRequestSchema.parse(request);
	return {
		vp_token: presentation.vpToken,
		state: parsedRequest.state,
	};
}
