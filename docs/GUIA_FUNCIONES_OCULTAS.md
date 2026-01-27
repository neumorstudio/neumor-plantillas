# Guia de funciones ocultas

Este proyecto tiene dos funcionalidades desactivadas por defecto para no interferir con el funcionamiento actual. Ambas pueden activarse mas adelante con variables de entorno.

## 1) Pedidos online (Stripe)

Estado actual:
- Oculto en la plantilla del restaurante si faltan claves de Stripe o URL del admin.
- Oculto en el panel admin si no se activa el flag.

Para activar:
1. Admin (Next, Vercel admin):
   - STRIPE_SECRET_KEY=sk_live_...
   - STRIPE_WEBHOOK_SECRET=whsec_...
   - NEXT_PUBLIC_ENABLE_ORDERS=true
2. Restaurante (Astro, Vercel template):
   - PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   - PUBLIC_ADMIN_URL=https://<tu-admin-domain>
     (o PUBLIC_ORDER_INTENT_URL si no usas PUBLIC_ADMIN_URL)
3. Stripe Dashboard:
   - Webhook a https://<tu-admin-domain>/api/stripe/webhook
   - Eventos: payment_intent.succeeded, payment_intent.payment_failed
4. Datos:
   - Crear menu_items por website_id.
   - Definir order_settings (pickup_start_time y pickup_end_time).

## 2) Google Business Profile

Estado actual:
- Oculto en el panel admin y las rutas API devuelven 404 si esta desactivado.

Para activar:
1. Admin (Next, Vercel admin):
   - NEXT_PUBLIC_ENABLE_GOOGLE_BUSINESS=true
   - GOOGLE_CLIENT_ID=...
   - GOOGLE_CLIENT_SECRET=...
   - GOOGLE_REDIRECT_URI=https://<tu-admin-domain>/api/google-business/auth/callback
   - TOKEN_ENCRYPTION_KEY=<clave_hex_32_bytes>
   - NEXT_PUBLIC_APP_URL=https://<tu-admin-domain>
2. Google Cloud Console:
   - Configurar OAuth consent + credenciales con el redirect exacto.
3. Redeploy del admin.

## Notas
- Las tablas y politicas ya estan creadas en Supabase para pedidos.
- Para activar en test, usa las claves pk_test_... / sk_test_....
