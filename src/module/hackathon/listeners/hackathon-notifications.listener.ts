import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HackathonJoinedEvent } from '../events/hackathon-joined.event.js';

@Injectable()
export class HackathonNotificationListener {
  private readonly logger = new Logger(HackathonNotificationListener.name);

  @OnEvent('hackathon.joined')
  handleHackathonJoined(event: HackathonJoinedEvent) {
    this.logger.log('User joined hackathon', {
      hackathonId: event.hackathonId,
      userId: event.userId,
      hackathonName: event.hackathonName,
    });
  }
}
