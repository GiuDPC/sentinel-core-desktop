import app from './app';
import { env } from './config/env';
app.listen(env.PORT, () => {
    console.log(`Sentinel-core corriendo en http://localhost:${env.PORT}`);
    console.log(`Entorno: ${env.NODE_ENV}`);
});
