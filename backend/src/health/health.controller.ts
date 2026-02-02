import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  async check() {
    const mongoStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    return {
      status: mongoStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
      },
    };
  }

  @Get('ready')
  async ready() {
    const isReady = this.connection.readyState === 1;
    return {
      ready: isReady,
    };
  }
}
