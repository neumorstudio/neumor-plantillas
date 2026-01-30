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

interface AppointmentEmailData {
  businessName: string;
  customerName: string;
  date: string;
  time: string;
  service: string;
  totalPrice?: string;
  professional?: string;
  notes?: string;
  phone?: string;
  email?: string;
  businessPhone?: string;
  businessAddress?: string;
  logoUrl?: string;
}

interface FitnessBookingEmailData {
  businessName: string;
  customerName: string;
  date: string;
  time: string;
  className: string;
  level?: string;
  notes?: string;
  phone?: string;
  email?: string;
  businessPhone?: string;
  businessAddress?: string;
}

interface ContactEmailData {
  businessName: string;
  customerName: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  details?: Array<{ label: string; value: string }>;
  businessPhone?: string;
  businessAddress?: string;
}

function renderDetailRows(rows: Array<{ label: string; value: string }>) {
  return rows
    .filter((row) => row.value)
    .map(
      (row) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-size: 14px;">${row.label}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <strong style="color: #111827; font-size: 14px;">${row.value}</strong>
        </td>
      </tr>
    `
    )
    .join("");
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

// Plantilla: Confirmacion de cita para Clinica (CLIENTE)
export function getClinicAppointmentConfirmationEmail(
  data: AppointmentEmailData
): string {
  const detailRows = renderDetailRows([
    { label: "Fecha", value: data.date },
    { label: "Hora", value: data.time },
    { label: "Servicio", value: data.service },
    ...(data.totalPrice ? [{ label: "Total", value: data.totalPrice }] : []),
    ...(data.professional ? [{ label: "Profesional", value: data.professional }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud de Cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
                Solicitud de cita recibida
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${data.businessName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
                Hemos recibido tu solicitud de cita. Te contactaremos para confirmar disponibilidad.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px;">
                      Detalles de la cita
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                      ${data.notes ? `
                      <tr>
                        <td colspan="2" style="padding: 15px 0 0 0;">
                          <span style="color: #6b7280; font-size: 14px;">Notas:</span>
                          <p style="color: #374151; font-size: 14px; margin: 5px 0 0 0; font-style: italic;">${data.notes}</p>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              ${data.businessPhone || data.businessAddress ? `
              <div style="background-color: #e0f2fe; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #0f172a; font-size: 14px; margin: 0;">
                  <strong>Necesitas cambiar tu cita?</strong><br>
                  ${data.businessPhone ? `Llamanos al <a href="tel:${data.businessPhone}" style="color: #0f172a;">${data.businessPhone}</a>` : ""}
                  ${data.businessAddress ? `<br>Direccion: ${data.businessAddress}` : ""}
                </p>
              </div>
              ` : ""}

              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Gracias por confiar en nosotros.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email fue enviado por ${data.businessName}
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                Powered by <a href="https://neumorstudio.com" style="color: #2563eb; text-decoration: none;">NeumorStudio</a>
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

// Plantilla: Notificacion de cita para Clinica (NEGOCIO)
export function getClinicAppointmentNotificationEmail(
  data: AppointmentEmailData
): string {
  const detailRows = renderDetailRows([
    { label: "Fecha", value: data.date },
    { label: "Hora", value: data.time },
    { label: "Servicio", value: data.service },
    ...(data.totalPrice ? [{ label: "Total", value: data.totalPrice }] : []),
    ...(data.professional ? [{ label: "Profesional", value: data.professional }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Nueva cita recibida
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #1d4ed8; margin: 0 0 15px 0; font-size: 16px;">
                  Datos del paciente
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #1d4ed8;">Nombre:</strong>
                      <span style="color: #1e40af; margin-left: 10px;">${data.customerName}</span>
                    </td>
                  </tr>
                  ${data.phone ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #1d4ed8;">Telefono:</strong>
                      <a href="tel:${data.phone}" style="color: #1e40af; margin-left: 10px; text-decoration: none;">${data.phone}</a>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.email ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #1d4ed8;">Email:</strong>
                      <a href="mailto:${data.email}" style="color: #1e40af; margin-left: 10px; text-decoration: none;">${data.email}</a>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">
                      Detalles de la cita
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                      ${data.notes ? `
                      <tr>
                        <td colspan="2" style="padding: 15px 0 0 0;">
                          <span style="color: #6b7280; font-size: 14px;">Notas:</span>
                          <p style="color: #374151; font-size: 14px; margin: 5px 0 0 0;">${data.notes}</p>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

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

// Plantilla: Confirmacion de cita para Salon (CLIENTE)
export function getSalonAppointmentConfirmationEmail(
  data: AppointmentEmailData
): string {
  const detailRows = renderDetailRows([
    { label: "Fecha", value: data.date },
    { label: "Hora", value: data.time },
    { label: "Servicio", value: data.service },
    ...(data.totalPrice ? [{ label: "Total", value: data.totalPrice }] : []),
    ...(data.professional ? [{ label: "Estilista", value: data.professional }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud de Cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf2f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf2f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

            <tr>
              <td style="background: linear-gradient(135deg, #16a34a 0%, #0f766e 100%); padding: 28px 30px; text-align: center;">
                ${data.logoUrl ? `
                <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px auto;">
                  <tr>
                    <td style="text-align: center;">
                      <img src="${data.logoUrl}" alt="${data.businessName}" style="height: 44px; max-width: 160px; object-fit: contain; border-radius: 8px; background: #ffffff; padding: 6px 10px; display: inline-block;" />
                    </td>
                  </tr>
                </table>
                ` : ""}
                <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; text-align: center;">
                      <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; border-radius: 999px; background: rgba(255,255,255,0.25); color: #ffffff; font-size: 14px; font-weight: 700; text-align: center; margin-right: 8px;">✓</span>
                    </td>
                    <td style="vertical-align: middle;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
                        Cita confirmada
                      </h1>
                    </td>
                  </tr>
                </table>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                  ${data.businessName}
                </p>
              </td>
            </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
                <p style="color: #475569; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
                  Tu cita esta confirmada. Te esperamos pronto para atenderte.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                      <h3 style="color: #14532d; margin: 0 0 20px 0; font-size: 18px;">
                        Detalles de tu cita
                      </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                      ${data.notes ? `
                      <tr>
                        <td colspan="2" style="padding: 15px 0 0 0;">
                            <span style="color: #166534; font-size: 14px;">Notas:</span>
                            <p style="color: #14532d; font-size: 14px; margin: 5px 0 0 0; font-style: italic;">${data.notes}</p>
                          </td>
                        </tr>
                        ` : ""}
                    </table>
                  </td>
                </tr>
              </table>

                ${data.businessPhone || data.businessAddress ? `
                <div style="background-color: #dcfce7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                  <p style="color: #166534; font-size: 14px; margin: 0; line-height: 1.5;">
                    <strong>¿Necesitas cambiar tu cita?</strong><br>
                    ${data.businessPhone ? `Llamanos al <a href="tel:${data.businessPhone}" style="color: #166534;">${data.businessPhone}</a>` : ""}
                    ${data.businessAddress ? `<br>Direccion: ${data.businessAddress}` : ""}
                    <br>¿Tienes un problema para venir o quieres cancelarla?
                  </p>
                </div>
                ` : ""}

                <p style="color: #475569; font-size: 14px; margin: 0; text-align: center;">
                  Gracias por confiar en nosotros. ¡Te esperamos!
                </p>
            </td>
          </tr>

          <tr>
              <td style="background-color: #ecfdf5; padding: 25px 30px; text-align: center; border-top: 1px solid #bbf7d0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email fue enviado por ${data.businessName}
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                  Powered by <a href="https://neumorstudio.com" style="color: #16a34a; text-decoration: none;">NeumorStudio</a>
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

// Plantilla: Notificacion de cita para Salon (NEGOCIO)
export function getSalonAppointmentNotificationEmail(
  data: AppointmentEmailData
): string {
  const detailRows = renderDetailRows([
    { label: "Fecha", value: data.date },
    { label: "Hora", value: data.time },
    { label: "Servicio", value: data.service },
    ...(data.totalPrice ? [{ label: "Total", value: data.totalPrice }] : []),
    ...(data.professional ? [{ label: "Estilista", value: data.professional }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf2f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf2f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

          <tr>
            <td style="background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Nueva cita de salon
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #fce7f3; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #9d174d; margin: 0 0 15px 0; font-size: 16px;">
                  Datos de la clienta
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9d174d;">Nombre:</strong>
                      <span style="color: #831843; margin-left: 10px;">${data.customerName}</span>
                    </td>
                  </tr>
                  ${data.phone ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9d174d;">Telefono:</strong>
                      <a href="tel:${data.phone}" style="color: #831843; margin-left: 10px; text-decoration: none;">${data.phone}</a>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.email ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9d174d;">Email:</strong>
                      <a href="mailto:${data.email}" style="color: #831843; margin-left: 10px; text-decoration: none;">${data.email}</a>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff1f2; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">
                      Detalles de la cita
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                      ${data.notes ? `
                      <tr>
                        <td colspan="2" style="padding: 15px 0 0 0;">
                          <span style="color: #9d174d; font-size: 14px;">Notas:</span>
                          <p style="color: #831843; font-size: 14px; margin: 5px 0 0 0;">${data.notes}</p>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fff1f2; padding: 20px 30px; text-align: center; border-top: 1px solid #fbcfe8;">
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

// Plantilla: Recordatorio 1h antes (Salon)
export function getSalonAppointmentReminder1hEmail(
  data: AppointmentEmailData
): string {
  const detailRows = renderDetailRows([
    { label: "Fecha", value: data.date },
    { label: "Hora", value: data.time },
    { label: "Servicio", value: data.service },
    ...(data.totalPrice ? [{ label: "Total", value: data.totalPrice }] : []),
    ...(data.professional ? [{ label: "Estilista", value: data.professional }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 26px 30px; text-align: center;">
              ${data.logoUrl ? `
              <div style="margin-bottom: 10px;">
                <img src="${data.logoUrl}" alt="${data.businessName}" style="height: 44px; max-width: 160px; object-fit: contain; border-radius: 8px; background: #ffffff; padding: 6px 10px;" />
              </div>
              ` : ""}
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Recordatorio de cita
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px;">
                ${data.businessName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              <p style="color: #475569; font-size: 15px; margin: 0 0 24px 0; line-height: 1.6;">
                Te recordamos que tu cita es en aproximadamente 1 hora. Te esperamos pronto.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="color: #1e3a8a; margin: 0 0 16px 0; font-size: 16px;">
                      Detalles de tu cita
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                      ${data.notes ? `
                      <tr>
                        <td colspan="2" style="padding: 12px 0 0 0;">
                          <span style="color: #1e3a8a; font-size: 14px;">Notas:</span>
                          <p style="color: #1e3a8a; font-size: 14px; margin: 5px 0 0 0; font-style: italic;">${data.notes}</p>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              ${data.businessPhone || data.businessAddress ? `
              <div style="background-color: #dbeafe; border-radius: 8px; padding: 14px; margin-bottom: 18px;">
                <p style="color: #1e3a8a; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>¿Necesitas cambiar tu cita?</strong><br>
                  ${data.businessPhone ? `Llamanos al <a href="tel:${data.businessPhone}" style="color: #1e3a8a;">${data.businessPhone}</a>` : ""}
                  ${data.businessAddress ? `<br>Direccion: ${data.businessAddress}` : ""}
                </p>
              </div>
              ` : ""}

              <p style="color: #475569; font-size: 14px; margin: 0; text-align: center;">
                Gracias por confiar en nosotros. ¡Te esperamos!
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #eff6ff; padding: 22px 30px; text-align: center; border-top: 1px solid #bfdbfe;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email fue enviado por ${data.businessName}
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                Powered by <a href="https://neumorstudio.com" style="color: #2563eb; text-decoration: none;">NeumorStudio</a>
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

// Plantilla: Confirmacion de reserva Fitness (CLIENTE)
export function getFitnessBookingConfirmationEmail(
  data: FitnessBookingEmailData
): string {
  const detailRows = renderDetailRows([
    { label: "Fecha", value: data.date },
    { label: "Hora", value: data.time },
    { label: "Clase", value: data.className },
    ...(data.level ? [{ label: "Nivel", value: data.level }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva de Entrenamiento</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff7ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
                Reserva de entrenamiento recibida
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${data.businessName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
                Hemos recibido tu reserva. En breve confirmaremos los detalles de tu sesion.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffedd5; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="color: #9a3412; margin: 0 0 20px 0; font-size: 18px;">
                      Detalles del entrenamiento
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                      ${data.notes ? `
                      <tr>
                        <td colspan="2" style="padding: 15px 0 0 0;">
                          <span style="color: #9a3412; font-size: 14px;">Notas:</span>
                          <p style="color: #7c2d12; font-size: 14px; margin: 5px 0 0 0; font-style: italic;">${data.notes}</p>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              ${data.businessPhone || data.businessAddress ? `
              <div style="background-color: #fed7aa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #7c2d12; font-size: 14px; margin: 0;">
                  <strong>Necesitas cambiar la sesion?</strong><br>
                  ${data.businessPhone ? `Llamanos al <a href="tel:${data.businessPhone}" style="color: #7c2d12;">${data.businessPhone}</a>` : ""}
                  ${data.businessAddress ? `<br>Direccion: ${data.businessAddress}` : ""}
                </p>
              </div>
              ` : ""}

              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Vamos a por tu objetivo.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffedd5; padding: 25px 30px; text-align: center; border-top: 1px solid #fed7aa;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email fue enviado por ${data.businessName}
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                Powered by <a href="https://neumorstudio.com" style="color: #f97316; text-decoration: none;">NeumorStudio</a>
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

// Plantilla: Notificacion de reserva Fitness (NEGOCIO)
export function getFitnessBookingNotificationEmail(
  data: FitnessBookingEmailData
): string {
  const detailRows = renderDetailRows([
    { label: "Fecha", value: data.date },
    { label: "Hora", value: data.time },
    { label: "Clase", value: data.className },
    ...(data.level ? [{ label: "Nivel", value: data.level }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff7ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Nueva reserva de entrenamiento
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #ffedd5; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #9a3412; margin: 0 0 15px 0; font-size: 16px;">
                  Datos del cliente
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9a3412;">Nombre:</strong>
                      <span style="color: #7c2d12; margin-left: 10px;">${data.customerName}</span>
                    </td>
                  </tr>
                  ${data.phone ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9a3412;">Telefono:</strong>
                      <a href="tel:${data.phone}" style="color: #7c2d12; margin-left: 10px; text-decoration: none;">${data.phone}</a>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.email ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9a3412;">Email:</strong>
                      <a href="mailto:${data.email}" style="color: #7c2d12; margin-left: 10px; text-decoration: none;">${data.email}</a>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffedd5; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">
                      Detalles de la reserva
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                      ${data.notes ? `
                      <tr>
                        <td colspan="2" style="padding: 15px 0 0 0;">
                          <span style="color: #9a3412; font-size: 14px;">Notas:</span>
                          <p style="color: #7c2d12; font-size: 14px; margin: 5px 0 0 0;">${data.notes}</p>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffedd5; padding: 20px 30px; text-align: center; border-top: 1px solid #fed7aa;">
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

// Plantilla: Confirmacion de contacto Tienda (CLIENTE)
export function getStoreContactConfirmationEmail(data: ContactEmailData): string {
  const detailRows = renderDetailRows([
    ...(data.subject ? [{ label: "Asunto", value: data.subject }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mensaje recibido</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
                Hemos recibido tu mensaje
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${data.businessName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
                Gracias por escribirnos. Nuestro equipo revisara tu consulta y te respondera lo antes posible.
              </p>

              ${detailRows ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #dcfce7; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="color: #166534; margin: 0 0 20px 0; font-size: 18px;">
                      Detalles de tu mensaje
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                    </table>
                    <p style="color: #166534; font-size: 14px; margin: 20px 0 0 0; white-space: pre-line;">${data.message}</p>
                  </td>
                </tr>
              </table>
              ` : ""}

              ${data.businessPhone || data.businessAddress ? `
              <div style="background-color: #bbf7d0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #166534; font-size: 14px; margin: 0;">
                  ${data.businessPhone ? `Telefono: <a href="tel:${data.businessPhone}" style="color: #166534;">${data.businessPhone}</a>` : ""}
                  ${data.businessAddress ? `<br>Direccion: ${data.businessAddress}` : ""}
                </p>
              </div>
              ` : ""}

              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Gracias por confiar en nuestra tienda.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #dcfce7; padding: 25px 30px; text-align: center; border-top: 1px solid #bbf7d0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email fue enviado por ${data.businessName}
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                Powered by <a href="https://neumorstudio.com" style="color: #16a34a; text-decoration: none;">NeumorStudio</a>
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

// Plantilla: Notificacion de contacto Tienda (NEGOCIO)
export function getStoreContactNotificationEmail(data: ContactEmailData): string {
  const detailRows = renderDetailRows([
    ...(data.subject ? [{ label: "Asunto", value: data.subject }] : []),
  ]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo contacto</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

          <tr>
            <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Nuevo mensaje de contacto
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #dcfce7; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">
                  Datos del cliente
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #166534;">Nombre:</strong>
                      <span style="color: #14532d; margin-left: 10px;">${data.customerName}</span>
                    </td>
                  </tr>
                  ${data.phone ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #166534;">Telefono:</strong>
                      <a href="tel:${data.phone}" style="color: #14532d; margin-left: 10px; text-decoration: none;">${data.phone}</a>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.email ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #166534;">Email:</strong>
                      <a href="mailto:${data.email}" style="color: #14532d; margin-left: 10px; text-decoration: none;">${data.email}</a>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">
                      Detalles del mensaje
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                    </table>
                    <p style="color: #166534; font-size: 14px; margin: 20px 0 0 0; white-space: pre-line;">${data.message}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #dcfce7; padding: 20px 30px; text-align: center; border-top: 1px solid #bbf7d0;">
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

// Plantilla: Confirmacion de presupuesto Reparaciones (CLIENTE)
export function getRepairsQuoteConfirmationEmail(data: ContactEmailData): string {
  const detailRows = renderDetailRows(data.details || []);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud de Presupuesto</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff7ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
                Solicitud de presupuesto recibida
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${data.businessName}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
                Hemos recibido tu solicitud de presupuesto. Te responderemos en menos de 48 horas.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffedd5; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="color: #9a3412; margin: 0 0 20px 0; font-size: 18px;">
                      Detalles del proyecto
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                    </table>
                    <p style="color: #7c2d12; font-size: 14px; margin: 20px 0 0 0; white-space: pre-line;">${data.message}</p>
                  </td>
                </tr>
              </table>

              ${data.businessPhone || data.businessAddress ? `
              <div style="background-color: #fed7aa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #7c2d12; font-size: 14px; margin: 0;">
                  ${data.businessPhone ? `Telefono: <a href="tel:${data.businessPhone}" style="color: #7c2d12;">${data.businessPhone}</a>` : ""}
                  ${data.businessAddress ? `<br>Direccion: ${data.businessAddress}` : ""}
                </p>
              </div>
              ` : ""}

              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Gracias por contar con nuestro equipo.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffedd5; padding: 25px 30px; text-align: center; border-top: 1px solid #fed7aa;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este email fue enviado por ${data.businessName}
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                Powered by <a href="https://neumorstudio.com" style="color: #f59e0b; text-decoration: none;">NeumorStudio</a>
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

// Plantilla: Notificacion de presupuesto Reparaciones (NEGOCIO)
export function getRepairsQuoteNotificationEmail(data: ContactEmailData): string {
  const detailRows = renderDetailRows(data.details || []);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Presupuesto</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff7ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">

          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Nueva solicitud de presupuesto
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #ffedd5; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #9a3412; margin: 0 0 15px 0; font-size: 16px;">
                  Datos del cliente
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9a3412;">Nombre:</strong>
                      <span style="color: #7c2d12; margin-left: 10px;">${data.customerName}</span>
                    </td>
                  </tr>
                  ${data.phone ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9a3412;">Telefono:</strong>
                      <a href="tel:${data.phone}" style="color: #7c2d12; margin-left: 10px; text-decoration: none;">${data.phone}</a>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.email ? `
                  <tr>
                    <td style="padding: 5px 0;">
                      <strong style="color: #9a3412;">Email:</strong>
                      <a href="mailto:${data.email}" style="color: #7c2d12; margin-left: 10px; text-decoration: none;">${data.email}</a>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffedd5; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">
                      Detalles del proyecto
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${detailRows}
                    </table>
                    <p style="color: #7c2d12; font-size: 14px; margin: 20px 0 0 0; white-space: pre-line;">${data.message}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffedd5; padding: 20px 30px; text-align: center; border-top: 1px solid #fed7aa;">
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
