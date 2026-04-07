import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { CreateApiKeyRequest, ApiKey, ApiKeyWithSecret, DeleteResult } from "./types";

export class ApiKeysService {
	constructor(private readonly client: HttpClient) {}

	async create(data: CreateApiKeyRequest): Promise<ServiceResult<ApiKeyWithSecret>> {
		return wrapServiceCall(
			() => this.client.post<ApiKeyWithSecret>("/orgs/api-keys", data, "creating API key"),
			this.client.handleApiError.bind(this.client),
			"creating API key",
		);
	}

	async list(): Promise<ServiceResult<ApiKey[]>> {
		return wrapServiceCall(
			() => this.client.get<ApiKey[]>("/orgs/api-keys", "listing API keys"),
			this.client.handleApiError.bind(this.client),
			"listing API keys",
		);
	}

	async revoke(keyId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.delete<DeleteResult>(`/orgs/api-keys/${keyId}`, "revoking API key"),
			this.client.handleApiError.bind(this.client),
			"revoking API key",
		);
	}
}
