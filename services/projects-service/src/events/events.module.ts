import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EventsService } from './events.service';

@Module({
  imports: [HttpModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
