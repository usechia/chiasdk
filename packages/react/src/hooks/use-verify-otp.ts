import { useMutation } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { VerifyOtpResponse } from "../types";

export function useVerifyOtp() {
	const { orgSlug, request, setToken } = useChia();

	return useMutation<VerifyOtpResponse, unknown, { email: string; code: string }>({
		mutationFn: ({ email, code }) =>
			request<VerifyOtpResponse>(`/s/${orgSlug}/portal/verify-otp`, { method: "POST", body: { email, code } }),
		onSuccess: (result) => {
			setToken(result.token, result.expiresAt);
		},
	});
}
