# iCurs@

App Next.js para gestión de contenido formativo.

## Desplegar en Vercel (acceso desde cualquier sitio)

Guía paso a paso: **[DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)**

Resumen: importa el repo en Vercel con **Root Directory = `icursa`** y copia las variables de **[.env.example](./.env.example)**.

## Arrancar en local

Desde la carpeta **`icursa`**:

```bash
pnpm dev
```

O desde la carpeta padre **`APP ICURSO`** (sin entrar en `icursa`):

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

Variables de entorno: copia y completa **`icursa/.env.local`** (no lo subas a repositorios públicos).

## Producción local

```bash
pnpm build
pnpm start
```

(O desde **`APP ICURSO`**: `pnpm build` y `pnpm start`.)
