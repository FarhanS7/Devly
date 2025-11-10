import { Injectable } from '@nestjs/common';

@Injectable()
export class MockNotificationProducer {
  async sendFollowNotification(): Promise<void> {
    return;
  }
}
