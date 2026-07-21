import { useQuery } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { PlansResponse } from "../types";

export function usePlans() {
	const { publishableKey, request } = useChia();
	return useQuery<PlansResponse>({
		queryKey: ["chia-plans", publishableKey],
		queryFn: ({ signal }) => request<PlansResponse>("/embed/v1/plans", { signal }),
		enabled: !!publishableKey,
	});
}
