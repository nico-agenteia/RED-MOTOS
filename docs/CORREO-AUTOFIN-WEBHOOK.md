# Correo a Autofin — configuración de webhooks (Araña 2.0)

> **Antes de enviar, reemplaza 2 datos:**
> - `{DOMINIO}` → el dominio donde quede desplegada la web (ej. `https://www.redmotos.cl`).
>   Los webhooks solo funcionan con la app **desplegada y pública** (no localhost).
> - `{TOKEN}` → el valor de `AUTOFIN_WEBHOOK_SECRET` que está en `.env.local`
>   (no se versiona por seguridad). Cópialo tal cual.
>
> Luego borra esta nota y envía lo de abajo.

---

**Para:** José Cumio (Autofin) · **Asunto:** Red Motos — URLs de webhook para notificaciones de Araña

Hola José, ¿cómo estás?

Avanzamos con la integración de Araña 2.0 vía API usando nuestro codSpider de QA
**C1751S175101**. Ya tenemos funcionando el cálculo de cuota (CUOTA-TRINIDAD) y el
envío de solicitudes vía iFrame.

Para cerrar el ciclo, queremos recibir las notificaciones de vuelta. ¿Podrían
configurar en la parametría de Araña los dos webhooks hacia estas URLs?

- **Resultado de inyección + evaluación** (sección 3.3 del manual):
  `{DOMINIO}/api/autofin/resultado?token={TOKEN}`

- **Seguimiento de estado de la solicitud** (sección 3.4 del manual):
  `{DOMINIO}/api/autofin/estado?token={TOKEN}`

**Una consulta sobre la autenticación del callback:** de nuestro lado validamos el
`?token=` que va en la URL (también podemos leerlo desde un header
`x-webhook-secret` si lo prefieren). ¿Les sirve enviar la URL con ese token
incluido, o ustedes autentican de otra forma (IP allowlist, un token/header
propio)? Nos dicen y lo dejamos calzado.

Por ahora es para el ambiente de **QA**; cuando pasemos a producción les avisamos
para actualizar el dominio y las credenciales.

¡Gracias! Quedamos atentos.

Saludos,
Nicolás
