export class ChiaApiError extends Error {
	readonly status: number;
	readonly body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.name = "ChiaApiError";
		this.status = status;
		this.body = body;
	}
}

export interface RequestOptions {
	method?: "GET" | "POST";
	signal?: AbortSignal;
	fetchImpl?: typeof fetch;
}

function joinUrl(base: string, path: string): string {
	return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function chiaRequest<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
	const { method = "GET", signal, fetchImpl } = options;
	const doFetch = fetchImpl ?? globalThis.fetch;

	const response = await doFetch(joinUrl(baseUrl, path), {
		method,
		signal,
		headers: { Accept: "application/json" },
	});

	const text = await response.text();
	let body: unknown = null;
	if (text) {
		try {
			body = JSON.parse(text);
		} catch {
			body = text;
		}
	}

	if (!response.ok) {
		const message =
			(body as { error?: string } | null)?.error ?? `Chia API request failed with status ${response.status}`;
		throw new ChiaApiError(message, response.status, body);
	}

	return body as T;
}
