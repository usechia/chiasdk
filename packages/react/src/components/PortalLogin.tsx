import { type FormEvent, useState } from "react";
import { ChiaApiError } from "../client";
import { useRequestOtp } from "../hooks/use-request-otp";
import { useVerifyOtp } from "../hooks/use-verify-otp";
import type { VerifyOtpResponse } from "../types";

export interface PortalLoginProps {
	/** Called after a code verifies and the session token is stored. */
	onAuthenticated?: (session: VerifyOtpResponse) => void;
	className?: string;
}

function verifyMessage(error: unknown): string {
	if (error instanceof ChiaApiError) {
		if (error.status === 429) return "Too many attempts. Wait a moment, then request a new code.";
		if (error.status === 400) return "That code is incorrect or has expired.";
	}
	return "Could not verify the code. Try again.";
}

export function PortalLogin({ onAuthenticated, className }: PortalLoginProps) {
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [stage, setStage] = useState<"email" | "code">("email");

	const requestOtp = useRequestOtp();
	const verifyOtp = useVerifyOtp();

	const submitEmail = (event: FormEvent) => {
		event.preventDefault();
		if (!email.trim()) return;
		requestOtp.mutate({ email: email.trim() }, { onSuccess: () => setStage("code") });
	};

	const submitCode = (event: FormEvent) => {
		event.preventDefault();
		if (!code.trim()) return;
		verifyOtp.mutate(
			{ email: email.trim(), code: code.trim() },
			{ onSuccess: (session) => onAuthenticated?.(session) },
		);
	};

	return (
		<section className={className ? `chia-portal-login ${className}` : "chia-portal-login"} data-stage={stage}>
			{stage === "email" ? (
				<form className="chia-form" onSubmit={submitEmail}>
					<label className="chia-field-label" htmlFor="chia-portal-email">
						Email
					</label>
					<input
						autoComplete="email"
						className="chia-input"
						id="chia-portal-email"
						inputMode="email"
						name="email"
						onChange={(event) => setEmail(event.target.value)}
						placeholder="you@example.com"
						type="email"
						value={email}
					/>
					{requestOtp.isError && (
						<p className="chia-notice" data-tone="error" role="alert">
							Could not send a code. Check the address and try again.
						</p>
					)}
					<button className="chia-button" disabled={requestOtp.isPending} type="submit">
						{requestOtp.isPending ? "Sending code..." : "Send code"}
					</button>
				</form>
			) : (
				<form className="chia-form" onSubmit={submitCode}>
					<p className="chia-form-hint">We sent a code to {email.trim()}. Enter it below.</p>
					<label className="chia-field-label" htmlFor="chia-portal-code">
						Code
					</label>
					<input
						autoComplete="one-time-code"
						className="chia-input"
						id="chia-portal-code"
						inputMode="numeric"
						name="code"
						onChange={(event) => setCode(event.target.value)}
						placeholder="123456"
						type="text"
						value={code}
					/>
					{verifyOtp.isError && (
						<p className="chia-notice" data-tone="error" role="alert">
							{verifyMessage(verifyOtp.error)}
						</p>
					)}
					<button className="chia-button" disabled={verifyOtp.isPending} type="submit">
						{verifyOtp.isPending ? "Verifying..." : "Verify"}
					</button>
					<button
						className="chia-button chia-button-quiet"
						onClick={() => {
							setCode("");
							setStage("email");
						}}
						type="button"
					>
						Use a different email
					</button>
				</form>
			)}
		</section>
	);
}
