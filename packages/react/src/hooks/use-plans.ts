import { useQuery } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { PlansResponse } from "../types";

export function usePlans() {
	const { orgSlug, request } = useChia();
	return useQuery<PlansResponse>({
		queryKey: ["chia-plans", orgSlug],
		queryFn: ({ signal }) => request<PlansResponse>(`/s/${orgSlug}/plans`, { signal }),
		enabled: !!orgSlug,
	});
}
