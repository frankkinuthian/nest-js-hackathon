export class HackathonJoinedEvent {
  constructor(
    public readonly hackathonId: string,
    public readonly userId: string,
    public readonly hackathonName: string,
  ) {}
}
