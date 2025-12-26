import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as os from 'os';

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Buscar IPv4 que no sea localhost
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = 3000;
  await app.listen(port);

  const localIP = getLocalIP();
  console.log('\n🚀 Aplicación iniciada exitosamente!');
  console.log('═════════════════════════════════════════');
  console.log(`📍 Servidor local:   http://localhost:${port}/api/v1`);
  console.log(`🌐 Servidor red:     http://${localIP}:${port}/api/v1`);
  console.log('═════════════════════════════════════════\n');
}
bootstrap();
