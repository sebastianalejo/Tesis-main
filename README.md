# Riskmap — Predicción de riesgo criminal (Lima)

Aplicación web (**React + Vite**) con **Firebase Hosting**, base de datos **Firestore** y API en **Cloud Functions (Python)** con **scikit-learn** (Random Forest).

## Qué hace el sistema

1. Guarda **registros de delitos** en la colección Firestore `crime_incidents`.
2. **Entrena** un modelo con esos datos (o con un `dataset` enviado en JSON al entrenar).
3. **Predice** el nivel de riesgo (`bajo` / `medio` / `alto`) para un escenario nuevo.

## Requisitos

- **Node.js** 20+ (`frontend/`)
- **Firebase CLI** (`npm install -g firebase-tools`)
- Cuenta Google y proyecto Firebase (**plan Blaze** necesario para desplegar Cloud Functions)

## Configuración del frontend

```bash
cd frontend
cp .env.example .env.local
# Rellena VITE_FIREBASE_* y VITE_FIREBASE_FUNCTIONS_ORIGIN (Consola Firebase → tu app web)
npm ci
npm run dev
```

## Despliegue

### Si en Hosting no puedes iniciar sesión con Firebase Auth

El SDK necesita la **configuración de la app web** (`apiKey`, `projectId`, etc.). El **UID de usuario no sustituye** eso: sirve para reglas o backend, no para inicializar el cliente.

**Opción A — variables Vite:** `frontend/.env.local` con `VITE_FIREBASE_*`, luego `npm run build`.

**Opción B — JSON en `public/` (sin prefijo `VITE_`):** copia [`frontend/public/firebase-config.example.json`](frontend/public/firebase-config.example.json) a `frontend/public/firebase-config.json` y pega el objeto **firebaseConfig** de la Consola (Configuración del proyecto → tu app web). Opcional: `functionsOrigin`; si lo omites y tienes `projectId`, se usa por defecto `https://us-central1-<projectId>.cloudfunctions.net`.

Luego **`npm run build`** (el JSON se copia a `dist/`) y **`firebase deploy --only hosting`**.

Sin `.env.local` ni `firebase-config.json`, la compilación no lleva credenciales del proyecto web y el login falla.

### Por qué sale el error de Blaze

Si ejecutas `firebase deploy` **sin más**, Firebase intenta desplegar **Hosting + Firestore + Cloud Functions**. Las Functions (sobre todo en Python) usan **Cloud Build** y **Artifact Registry** para construir la imagen del contenedor. Esas APIs **solo se pueden activar con el plan Blaze** (pago por uso). No es un fallo del proyecto: es la política de Google para ese producto.

**Opciones:**

1. **Activar Blaze** en el enlace que muestra el CLI (`…/usage/details`), poner método de pago y (recomendado) un **presupuesto / alertas** en Google Cloud. Con Blaze, el despliegue completo suele seguir barato o en 0 € en proyectos pequeños.

2. **Sin Blaze (solo web + reglas Firestore):** despliega **sin** Functions; el panel subirá a Hosting y las reglas de Firestore se aplicarán, pero **no habrá API** hasta que subas Functions con Blaze.

```bash
cd frontend && npm run build && cd ..
firebase deploy --only hosting,firestore
```

3. **Despliegue completo** (cuando ya tengas Blaze):

```bash
cd frontend && npm run build && cd ..
firebase deploy --only hosting,functions,firestore
```

Evita volver a ejecutar `firebase init` en la raíz con carpeta de salida incorrecta: el hosting debe apuntar a **`frontend/dist`** (ya está en [`firebase.json`](firebase.json)).

## Firestore

| Colección | Uso |
|-----------|-----|
| `crime_incidents` | Filas de delitos (campos del modelo ML). |
| `ml_model_parts` | Trozos del modelo entrenado (solo escritura vía Functions / Admin SDK). |

Reglas: [`firestore.rules`](firestore.rules).

## Código ML

Lógica en [`functions/crime_ml/pipeline.py`](functions/crime_ml/pipeline.py). Las funciones HTTP están en [`functions/main.py`](functions/main.py).

## Estructura

```
frontend/          # Panel React
functions/         # Cloud Functions + crime_ml
firebase.json      # Hosting, Functions, Firestore
firestore.rules
.firebaserc        # ID de proyecto Firebase
```
