import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { CreatePlanRequest, Plan, UpdatePlanRequest, DeleteResult } from "./types";

export class PlansService {
	constructor(private readonly client: HttpClient) {}

	async create(data: CreatePlanRequest): Promise<ServiceResult<Plan>> {
		return wrapServiceCall(
			() => this.client.post<Plan>("/plans", data, "creating plan"),
			this.client.handleApiError.bind(this.client),
			"creating plan",
		);
	}

	async list(): Promise<ServiceResult<Plan[]>> {
		return wrapServiceCall(
			() => this.client.get<Plan[]>("/plans", "listing plans"),
			this.client.handleApiError.bind(this.client),
			"listing plans",
		);
	}

	async get(planId: string): Promise<ServiceResult<Plan>> {
		return wrapServiceCall(
			() => this.client.get<Plan>(`/plans/${planId}`, "getting plan"),
			this.client.handleApiError.bind(this.client),
			"getting plan",
		);
	}

	async update(planId: string, data: UpdatePlanRequest): Promise<ServiceResult<Plan>> {
		return wrapServiceCall(
			() => this.client.patch<Plan>(`/plans/${planId}`, data, "updating plan"),
			this.client.handleApiError.bind(this.client),
			"updating plan",
		);
	}

	async delete(planId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.delete<DeleteResult>(`/plans/${planId}`, "deleting plan"),
			this.client.handleApiError.bind(this.client),
			"deleting plan",
		);
	}
}
