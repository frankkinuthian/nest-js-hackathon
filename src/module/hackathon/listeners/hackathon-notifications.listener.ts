import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HackathonJoinedEvent } from '../events/hackathon-joined.event.js';

@Injectable()
export class HackathonNotificationListener {
  @OnEvent('hackathon.joined')
  handleHackathonJoined(event: HackathonJoinedEvent) {
    // Send notifs here, welcome emails/ log to analytics service here
    console.log(`User ${event.userId} joined hackathon ${event.hackathonName}`);
  }
}
