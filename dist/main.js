"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Rifq Backend API')
        .setDescription('API documentation for Rifq backend')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api', app, swaggerDocument);
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port);
    common_1.Logger.log(`Server running on http://localhost:${port}`);
}
bootstrap().catch((err) => {
    if (err instanceof Error) {
        common_1.Logger.error('Error starting server', err.message, err.stack);
    }
    else {
        common_1.Logger.error('Unknown error starting server', JSON.stringify(err));
    }
});
//# sourceMappingURL=main.js.map