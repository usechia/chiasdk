import { useStoreMutation } from "../internal/hooks";
import { useChia } from "../provider";
import type { VerifyOtpResponse } from "../types";

export function useVerifyOtp() {
	const { request, setToken } = useChia();

	return useStoreMutation<VerifyOtpResponse, { email: string; code: string }>({
		mutationFn: ({ email, code }) =>
			request<VerifyOtpResponse>("/embed/v1/portal/verify-otp", { method: "POST", body: { email, code } }),
		onSuccess: (result) => {
			setToken(result.token, result.expiresAt);
		},
	});
}
