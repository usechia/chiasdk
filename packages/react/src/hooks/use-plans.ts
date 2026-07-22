import { useStoreQuery } from "../internal/hooks";
import { useChia, useChiaStore } from "../provider";
import type { PlansResponse } from "../types";

export function usePlans() {
	const { publishableKey, request } = useChia();
	const store = useChiaStore();

	return useStoreQuery<PlansResponse>(store, {
		key: `chia-plans:${publishableKey}`,
		enabled: !!publishableKey,
		fetcher: (signal) => request<PlansResponse>("/embed/v1/plans", { signal }),
	});
}
