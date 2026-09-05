export class OrderCreatedEvent {
  constructor(
    public readonly order: any,
    public readonly tenantId: string,
  ) {}
}

export class OrderStatusUpdatedEvent {
  constructor(
    public readonly order: any,
    public readonly previousStatus: string,
    public readonly tenantId: string,
    public readonly customMessage?: string,
  ) {}
}
