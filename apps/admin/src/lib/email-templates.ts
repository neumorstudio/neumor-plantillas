// Plantillas de email para reservas y notificaciones

interface ReservationEmailData {
  restaurantName: string;
  customerName: string;
  date: string;
  time: string;
  guests: number;
  zone?: string;
  occasion?: string;
  notes?: string;
  phone?: string;
  email?: string;
  restaurantPhone?: string;
  restaurantAddress?: string;
}

// Plantilla: Confirmacion de reserva al CLIENTE
export function getCustomerConfirmationEmail(data: ReservationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmacion de Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                Reserva Confirmada
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${data.restaurantName}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
                Tu reserva ha sido recibida correctamente. Te contactaremos para confirmar los detalles.
              </p>

              <!-- Reservation Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px;">
                      Detalles de tu reserva
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Fecha</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <strong style="color: #111827; font-size: 14px;">${data.date}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Hora</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <strong style="color: #111827; font-size: 14px;">${data.time}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Personas</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <strong style="color: #111827; font-size: 14px;">${data.guests}</strong>
                        </td>
                      </tr>
                      ${data.zone ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Zona</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <strong style="color: #111827; font-size: 14px;">${data.zone}</strong>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.occasion ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Ocasion</span>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <strong style="color: #111827; font-size: 14px;">${data.occasion}</strong>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.notes ? `
                      <tr>
                        <td colspan="2" style="padding: 15px 0 0 0;">
                          <span style="color: #6b7280; font-size: 14px;">Notas:</span>
                          <p style="color: #374151; font-size: 14px; margin: 5px 0 0 0; font-style: italic;">${data.notes}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Contact Info -->
              ${data.restaurantPhone || data.restaurantAddress ? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>¿Necesitas modificar tu reserva?</strong><br>
                  ${data.restaurantPhone ? `Llamanos al <a href="tel:${data.restaurantPhone}" style="color: #92400e;">${data.restaurantPhone}</a>` : ''}
                  ${data.restaurantAddress ? `<br>Direccion: ${data.restaurantAddress}` : ''}
                </p>
              </div>
              ` : ''}

              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                ¡Te esperamos!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email fue enviado por ${data.restaurantName}
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                Powered by <a href="https://neumorstudio.com" style="color: #667eea; text-decoration: none;">NeumorStudio</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Plantilla: Notificacion de nueva reserva al RESTAURANTE
export function getRestaurantNotificationEmail(data: ReservationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Nueva Reserva Recibida
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">

              <!-- Cliente Info -->
              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">
                  Datos del Cliente
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #065f46;">Nombre:</strong>
                      <span style="color: #047857; margin-left: 10px;">${data.customerName}</span>
                    </td>
                  </tr>
                  ${data.phone ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #065f46;">Telefono:</strong>
                      <a href="tel:${data.phone}" style="color: #047857; margin-left: 10px; text-decoration: none;">${data.phone}</a>
                    </td>
                  </tr>
                  ` : ''}
                  ${data.email ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #065f46;">Email:</strong>
                      <a href="mailto:${data.email}" style="color: #047857; margin-left: 10px; text-decoration: none;">${data.email}</a>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- Reservation Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">
                      Detalles de la Reserva
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding: 8px; background-color: #ffffff; border-radius: 8px; margin: 5px;">
                          <span style="color: #6b7280; font-size: 12px; display: block;">FECHA</span>
                          <strong style="color: #111827; font-size: 16px;">${data.date}</strong>
                        </td>
                        <td width="50%" style="padding: 8px; background-color: #ffffff; border-radius: 8px; margin: 5px;">
                          <span style="color: #6b7280; font-size: 12px; display: block;">HORA</span>
                          <strong style="color: #111827; font-size: 16px;">${data.time}</strong>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px;">
                      <tr>
                        <td width="33%" style="padding: 8px; background-color: #ffffff; border-radius: 8px; text-align: center;">
                          <span style="color: #6b7280; font-size: 12px; display: block;">PERSONAS</span>
                          <strong style="color: #111827; font-size: 20px;">${data.guests}</strong>
                        </td>
                        ${data.zone ? `
                        <td width="33%" style="padding: 8px; background-color: #ffffff; border-radius: 8px; text-align: center;">
                          <span style="color: #6b7280; font-size: 12px; display: block;">ZONA</span>
                          <strong style="color: #111827; font-size: 14px;">${data.zone}</strong>
                        </td>
                        ` : ''}
                        ${data.occasion ? `
                        <td width="33%" style="padding: 8px; background-color: #ffffff; border-radius: 8px; text-align: center;">
                          <span style="color: #6b7280; font-size: 12px; display: block;">OCASION</span>
                          <strong style="color: #111827; font-size: 14px;">${data.occasion}</strong>
                        </td>
                        ` : ''}
                      </tr>
                    </table>

                    ${data.notes ? `
                    <div style="margin-top: 15px; padding: 12px; background-color: #fef3c7; border-radius: 8px;">
                      <span style="color: #92400e; font-size: 12px; font-weight: 600;">NOTAS:</span>
                      <p style="color: #78350f; font-size: 14px; margin: 5px 0 0 0;">${data.notes}</p>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <div style="text-align: center; margin-top: 25px;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Ver en Dashboard
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                Notificacion automatica de NeumorStudio
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Plantilla: Recordatorio 24h antes
export function getReminder24hEmail(data: ReservationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                ¡Te esperamos manana!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${data.restaurantName}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
                Este es un recordatorio de tu reserva para <strong>manana</strong>.
              </p>

              <!-- Big Date/Time Display -->
              <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; margin-bottom: 30px;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                  Tu reserva
                </p>
                <p style="color: #78350f; font-size: 28px; font-weight: 700; margin: 0;">
                  ${data.date}
                </p>
                <p style="color: #92400e; font-size: 22px; margin: 10px 0 0 0;">
                  ${data.time} - ${data.guests} personas
                </p>
              </div>

              ${data.restaurantPhone ? `
              <div style="text-align: center; margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  ¿Necesitas cancelar o modificar?
                </p>
                <a href="tel:${data.restaurantPhone}" style="color: #d97706; font-size: 18px; font-weight: 600; text-decoration: none;">
                  ${data.restaurantPhone}
                </a>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ${data.restaurantName}
                ${data.restaurantAddress ? ` - ${data.restaurantAddress}` : ''}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
