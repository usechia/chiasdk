import { useStoreMutation } from "../internal/hooks";
import { useChia } from "../provider";
import type { OtpResponse } from "../types";

export function useRequestOtp() {
	const { request } = useChia();

	return useStoreMutation<OtpResponse, { email: string }>({
		mutationFn: ({ email }) =>
			request<OtpResponse>("/embed/v1/portal/request-otp", { method: "POST", body: { email } }),
	});
}
