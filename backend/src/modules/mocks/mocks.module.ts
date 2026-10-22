import { Module } from '@nestjs/common'
import { BkiMockService } from './bki-mock.service'
import { MocksController } from './mocks.controller'
import { RegistryMockService } from './registry-mock.service'

@Module({
  controllers: [MocksController],
  providers: [BkiMockService, RegistryMockService],
  exports: [BkiMockService, RegistryMockService],
})
export class MocksModule {}
