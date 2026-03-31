import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { AuthForm } from "./components/auth-form.tsx";
import { IssuanceDetailCard } from "./components/issuance-detail.tsx";

describe("issuer web client components", () => {
	test("renders username auth form", () => {
		const html = renderToString(
			<AuthForm
				mode="signup"
				name=""
				password="secret"
				confirmPassword="secret"
				message={null}
				alternateHref="/signin"
				alternateLabel="Already have an account?"
				onNameChange={() => undefined}
				onPasswordChange={() => undefined}
				onConfirmPasswordChange={() => undefined}
				onSubmit={() => undefined}
			/>,
		);
		expect(html).toContain("Username");
		expect(html).toContain("Confirm password");
		expect(html).not.toContain("Email");
	});

	test("renders auth form without alternate link", () => {
		const html = renderToString(
			<AuthForm
				mode="signup"
				name="guest-upgrade"
				password="secret"
				confirmPassword="secret"
				message={null}
				submitLabel="Link account"
				onNameChange={() => undefined}
				onPasswordChange={() => undefined}
				onConfirmPasswordChange={() => undefined}
				onSubmit={() => undefined}
			/>,
		);
		expect(html).toContain("Link account");
		expect(html).not.toContain("Already have an account?");
	});

	test("renders auth form in disabled state with saving text", () => {
		const html = renderToString(
			<AuthForm
				mode="signin"
				name="testuser"
				password="secret"
				message={null}
				disabled={true}
				onNameChange={() => undefined}
				onPasswordChange={() => undefined}
				onSubmit={() => undefined}
			/>,
		);
		expect(html).toContain("Saving...");
		expect(html).toContain("disabled");
	});

	test("renders error messages with destructive styling", () => {
		const html = renderToString(
			<AuthForm
				mode="signin"
				name=""
				password=""
				message="Invalid credentials"
				onNameChange={() => undefined}
				onPasswordChange={() => undefined}
				onSubmit={() => undefined}
			/>,
		);
		expect(html).toContain("Invalid credentials");
		expect(html).toContain("text-destructive");
	});

	test("renders issuance detail status and qr payload", () => {
		const html = renderToString(
			<IssuanceDetailCard
				detail={{
					issuance: {
						id: "issuance-1",
						ownerUserId: "user-1",
						templateId: "template-1",
						credentialConfigurationId: "conference-pass",
						vct: "https://issuer.example/credentials/conference-pass",
						claims: { given_name: "Ada" },
						state: "redeemed",
						status: 2,
						offerUri: "openid-credential-offer://?credential_offer=...",
						statusListId: "default",
						statusListIndex: 0,
						credential: "eyJ...",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					qrPayload: "openid-credential-offer://?credential_offer=...",
				}}
			/>,
		);
		expect(html).toContain("suspended");
		expect(html).toContain("Redeemed");
		// Redeemed issuances should NOT show the wallet handoff QR/URI
		expect(html).not.toContain("Wallet handoff");
		expect(html).toContain("Credential redeemed");
		expect(html).toContain("Back to overview");
	});

	test("renders wallet handoff for offered issuance", () => {
		const html = renderToString(
			<IssuanceDetailCard
				detail={{
					issuance: {
						id: "issuance-2",
						ownerUserId: "user-1",
						templateId: "template-1",
						credentialConfigurationId: "conference-pass",
						vct: "https://issuer.example/credentials/conference-pass",
						claims: { given_name: "Grace" },
						state: "offered",
						status: 0,
						offerUri: "openid-credential-offer://?credential_offer=offered",
						statusListId: "default",
						statusListIndex: 1,
						credential: null,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					qrPayload: "openid-credential-offer://?credential_offer=offered",
				}}
			/>,
		);
		expect(html).toContain("Wallet handoff");
		expect(html).toContain("Offered");
		expect(html).not.toContain("active");
		expect(html).not.toContain("Credential redeemed");
		expect(html).not.toContain("Back to overview");
	});

	test("renders expired presentation for expired issuance", () => {
		const html = renderToString(
			<IssuanceDetailCard
				detail={{
					issuance: {
						id: "issuance-3",
						ownerUserId: "user-1",
						templateId: "template-1",
						credentialConfigurationId: "conference-pass",
						vct: "https://issuer.example/credentials/conference-pass",
						claims: { given_name: "Emmy" },
						state: "expired",
						status: 0,
						offerUri: "openid-credential-offer://?credential_offer=expired",
						statusListId: "default",
						statusListIndex: 2,
						credential: null,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					qrPayload: "openid-credential-offer://?credential_offer=expired",
				}}
			/>,
		);
		expect(html).toContain("Offer expired");
		expect(html).not.toContain("Wallet handoff");
		expect(html).toContain("Back to overview");
	});
});
