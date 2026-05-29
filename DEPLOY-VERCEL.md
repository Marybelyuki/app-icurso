# Desplegar iCurs@ en Vercel

Tu app vive en la carpeta **`icursa`**. En Vercel debes indicar esa carpeta como **Root Directory**.

## Requisitos

- Cuenta en [vercel.com](https://vercel.com) (puedes entrar con GitHub).
- Repositorio Git (GitHub recomendado) con el código, **o** despliegue con la CLI de Vercel.
- Proyecto Supabase ya creado (las mismas variables que en `.env.local`).

## Opción A — Desde GitHub (recomendada)

### 1. Subir el código a GitHub

Desde **`APP ICURSO`** (carpeta padre):

```powershell
git init
git add .
git commit -m "Preparar despliegue en Vercel"
```

Crea un repo vacío en GitHub y enlázalo:

```powershell
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

> No subas `.env.local`: está en `.gitignore`.

### 2. Importar en Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** tu repositorio.
2. **Root Directory** → **Edit** → escribe `icursa` → Confirm.
3. **Framework Preset**: Next.js (detectado automáticamente).
4. **Build Command**: `pnpm build` (por defecto).
5. **Install Command**: `pnpm install` (por defecto).

### 3. Variables de entorno

En el asistente de importación (o después en **Settings → Environment Variables**), añade las de `.env.example`:

| Variable | Entornos |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview (secreto) |
| `OPENAI_API_KEY` | Production, Preview (si usas IA) |
| `ANTHROPIC_API_KEY` | Production, Preview (si usas IA) |
| `GAMMA_API_KEY` | Production, Preview (si usas Gamma) |

Pulsa **Deploy**.

### 4. URL de producción

Tras el build verás algo como `https://icursa-xxx.vercel.app`. Cada `git push` a `main` vuelve a desplegar.

---

## Opción B — CLI sin GitHub

```powershell
cd "c:\Users\maryb\PROYECTOS MARIBEL\APP ICURSO\icursa"
pnpm add -g vercel
vercel login
vercel
```

Responde las preguntas; en la primera vez enlaza el proyecto. Luego copia las variables con:

```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... repite para cada variable
vercel --prod
```

---

## Supabase

No hace falta cambiar la URL del proyecto en Supabase para una app sin login por cookies, siempre que las claves API sean correctas.

Si más adelante añades autenticación con redirect, en **Supabase → Authentication → URL Configuration** añade:

- Site URL: `https://TU_DOMINIO.vercel.app`
- Redirect URLs: `https://TU_DOMINIO.vercel.app/**`

---

## Comprobar el despliegue

1. Abre la URL de Vercel.
2. Entra a **Contenido** y crea o abre un curso.
3. Prueba **Exportar PDF** (usa Chromium en el servidor de Vercel).

Si el build falla, revisa **Deployments → View Build Logs** en el panel de Vercel.

---

## Dominio propio (opcional)

**Project → Settings → Domains** → añade por ejemplo `icursa.tudominio.com` y sigue las instrucciones DNS.
