# 3DPrintNova

Catálogo independiente de los anuncios públicos del perfil [3DPrintNova en Wallapop](https://www.wallapop.com/user/diegoc-480763225). Incluye fotos, títulos, descripciones y precios, con enlaces para ver o comprar cada producto en Wallapop.

## Desplegar en Vercel

1. Entra en [vercel.com/new](https://vercel.com/new), conecta GitHub e importa este repositorio.
2. Selecciona **Framework Preset: Other**, **Root Directory: /** y deja los comandos de compilación vacíos. Publica el proyecto.
3. Cada `push` a la rama principal desplegará una versión nueva. Los anuncios se consultan al cargar la web, con caché de cinco minutos.

No se requieren claves de API ni variables de entorno. La función `api/catalog.js` consulta los endpoints públicos de Wallapop desde el servidor; el navegador no necesita acceso directo a su API. Si Wallapop cambia su API o limita las consultas, se muestra la última copia de `snapshot.json` con un aviso visible; actualízala manualmente cuando sea necesario. La compra y el pago se hacen en Wallapop. Este sitio no está afiliado a Wallapop.

## Ejecutar en local

Con Node.js 20 o posterior: `npm run dev` y abre http://localhost:3000. Ejecuta `npm test` para probar la normalización de los datos. No hay dependencias externas.

## Impresión personalizada

El anuncio `impresiones-3d-1292053393` se presenta como un servicio, no como un producto de precio cero. La web muestra los demás anuncios en el catálogo.

El formulario de servicio prepara una solicitud en `https://api.whatsapp.com/send` para el número público `34623351207`. Incluye enlace público del modelo, tamaño, medidas opcionales, uso y material solicitado. Solo se abre WhatsApp tras pulsar el botón; el cliente revisa y envía el mensaje. La web no descarga ni sube archivos de modelos.

Los tamaños son rangos orientativos por el lado más largo: pequeño hasta 10 cm, mediano hasta 20 cm y grande por encima de 20 cm. Las tres medidas introducidas calculan ese rango automáticamente. El material se recomienda por uso (PLA para decoración de interior, PETG para piezas rígidas funcionales y TPU para piezas flexibles), permite elección manual y queda sujeto a confirmación con el presupuesto.
