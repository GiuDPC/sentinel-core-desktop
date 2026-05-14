# 🛡️ Protocolo Militar: Auditoría Local y Despliegue CI/CD

Este documento contiene el paso a paso exacto para verificar que la arquitectura Zero Trust y la migración a Tauri v2 de **Sentinel Core** funcionan de manera impecable antes de enviar el código a producción.

---

## 🧩 1. Entendiendo la Magia de Tauri

Antes de ejecutar nada, es vital que entiendas cómo Tauri maneja los binarios cruzados, ya que no empaqueta un navegador entero como hace Electron, sino que utiliza el motor web nativo del SO:

*   **Para Windows 10 (1809 en adelante)**: Al haber configurado `"downloadBootstrapper"` en el `tauri.conf.json`, el instalador `.exe` o `.msi` verificará si la PC del usuario tiene **WebView2** (basado en Chromium). Si es un Windows desactualizado que no lo tiene, lo descargará e instalará automáticamente durante el setup.
*   **Para Linux (Ubuntu / CachyOS)**: El workflow de GitHub Actions compila en Ubuntu y genera dos archivos: un `.deb` (para distros basadas en Debian) y un `.AppImage` (empaquetado universal). Como tú usas **CachyOS** (basado en Arch), simplemente descargarás el `.AppImage` que genere GitHub, le darás permisos de ejecución (`chmod +x archivo.AppImage`) y lo abrirás con doble clic. Todo funcionará nativamente sobre **WebKit2GTK**.

---

## 🕵️‍♂️ 2. Auditoría Local: La Prueba de Fuego

**REGLA DE ORO:** No vas a subir ni una sola línea de código a GitHub hasta que no pases esta prueba en tu máquina local. 

Abre tu terminal. Asegúrate de estar en la raíz del proyecto:
```bash
cd c:\Users\Giuseppe\Documents\sentinel-core-desktop
```

### Paso 1: El Primer Arranque (Compilación Local)
Ejecuta el comando maestro para iniciar el entorno de desarrollo:
```bash
npm run tauri dev
```
> **Atención:** La primera vez va a tardar un buen rato (quizás 5-10 minutos dependiendo de tu CPU). Esto ocurre porque `cargo` (el gestor de Rust) tiene que descargar y compilar desde cero librerías pesadas como `sqlx`, `tokio` y `argon2`. **Ten paciencia y no lo canceles.**

### Paso 2: Verificación de la Base de Datos (Zero Trust)
Si la app levanta y muestra la pantalla de Login de React, **NO inicies sesión todavía**. Vamos a auditar si Rust y el script `seed.rs` hicieron su trabajo sucio.

1.  Abre tu explorador de archivos.
2.  Ve a la ruta de datos de tu app:
    *   **En Windows:** Presiona `Win + R`, escribe `%APPDATA%` y pulsa Enter. Busca la carpeta de la app, que probablemente se llame `com.sentinel.core`.
    *   **En Linux/CachyOS:** Ve a `~/.local/share/com.sentinel.core/`.
3.  Verifica que el archivo `sentinel_core.db` exista. 
4.  Comprueba su peso. Si pesa más de unos pocos KB, significa que la fase de *Seeding* inyectó los 35 tickets, los roles, las categorías y los usuarios con éxito.

### Paso 3: Pruebas de Estrés en la UI (HashRouter y Estado Local)
Ahora sí, vuelve a la ventana de la aplicación Tauri y ejecuta el siguiente estrés:

1.  **Inicio de Sesión:** Inicia sesión con el Admin de prueba generado en el seed:
    *   **Email:** `admin@sentinel.local`
    *   **Password:** `SentinelAdmin2026!`
2.  **Verificación de IPC:** Verifica que el Dashboard cargue los gráficos y las métricas. Si lo hace, confirma que `api.invoke` está hablando correctamente con SQLite en Rust.
3.  **Prueba Crítica del Router:** Navega a la vista de "Tickets" o "Usuarios". Una vez ahí, presiona **F5** (o `Ctrl + R` / `Cmd + R`) para recargar la ventana de Tauri. 
    *   *Resultado esperado:* La app debe volver a cargar la misma vista sin mostrar una pantalla en blanco, confirmando que `HashRouter` funciona perfecto en el entorno de escritorio.
4.  **Prueba de Persistencia de Sesión:** 
    *   Cierra la aplicación por completo.
    *   Vuelve a ejecutar en tu terminal: `npm run tauri dev`.
    *   *Resultado esperado:* Debes entrar directamente al Dashboard sin que te pida contraseña. Esto confirma que el plugin `tauri-plugin-store` guardó tu token de sesión exitosamente en el disco.

---

## ☁️ 3. ¿Cómo probar la compilación en GitHub Actions?

Una vez que tu auditoría local sea un éxito total (todo compila, la DB se crea, puedes iniciar sesión con los 3 roles y no hay pantallas blancas al recargar), es hora de poner a prueba el CI/CD en la nube.

### Paso 1: Subir el código
Desde tu terminal, en la carpeta `sentinel-core-desktop`, ejecuta:

```bash
git add .
git commit -m "feat: migración completa a tauri v2 y rust"
git push origin main
```
*(Si estás trabajando en otra rama, asegúrate de fusionarla a `main` o hacer el push a tu rama correspondiente).*

### Paso 2: Observar la magia en GitHub
1.  Ve a tu repositorio en GitHub: [https://github.com/GiuDPC/sentinel-core-desktop](https://github.com/GiuDPC/sentinel-core-desktop)
2.  Haz clic en la pestaña **"Actions"**.
3.  Verás un workflow ejecutándose (el que configuramos en `.github/workflows/build.yml`). 
4.  Si haces clic en el proceso, verás dos máquinas virtuales (`ubuntu-latest` y `windows-latest`) corriendo en paralelo.

### Paso 3: Descargar los Instaladores
Cuando el proceso termine y se ponga en **verde**:
1.  Ve a la página principal de tu repositorio.
2.  Busca la sección **"Releases"** (en el panel de la derecha). 
3.  GitHub habrá creado automáticamente un **"Borrador de Release" (Draft)** con el tag de tu versión.
4.  Adentro estarán los archivos **`.exe`**, **`.msi`**, **`.deb`** y **`.AppImage`** listos para ser descargados, probados y distribuidos.

---
**¡Dale a ese `npm run tauri dev`, mira cómo compila esa belleza en Rust y verifica que tu fortaleza esté en pie!**
