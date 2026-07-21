import { useMutation } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { OtpResponse } from "../types";

export function useRequestOtp() {
	const { request } = useChia();

	return useMutation<OtpResponse, unknown, { email: string }>({
		mutationFn: ({ email }) =>
			request<OtpResponse>("/embed/v1/portal/request-otp", { method: "POST", body: { email } }),
	});
}
