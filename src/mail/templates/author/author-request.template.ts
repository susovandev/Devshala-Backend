import { env } from '@config/env.js';

export interface IAuthorRequestEmailTemplateParams {
  APP_NAME?: string;
  PUBLISHER_NAME: string;
  USER_NAME: string;
  USER_EMAIL: string;
  USER_MESSAGE?: string;
  REVIEW_URL: string;
  SUPPORT_EMAIL?: string;
  YEAR?: number;
}

export default function authorRequestEmailTemplate(params: IAuthorRequestEmailTemplateParams) {
  const {
    APP_NAME = 'DevShala',
    PUBLISHER_NAME = 'Publisher',
    USER_NAME,
    USER_EMAIL,
    USER_MESSAGE = 'No additional message provided.',
    REVIEW_URL,
    SUPPORT_EMAIL = env.SUPPORT_EMAIL || 'support@devshala.com',
    YEAR = new Date().getFullYear(),
  } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Author Access Request</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:24px 0;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:600px; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background:#4f46e5; padding:22px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">
                ${APP_NAME}
              </h1>
              <p style="margin:6px 0 0; color:#e0e7ff; font-size:14px;">
                Author Access Request
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <h2 style="margin-top:0; color:#111827; font-size:20px;">
                Hello ${PUBLISHER_NAME},
              </h2>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                A new user has requested permission to become an <strong>Author</strong> on ${APP_NAME}.
              </p>

              <!-- User Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="margin:24px 0; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px; font-size:14px; color:#6b7280;">
                      <strong>Name:</strong> ${USER_NAME}
                    </p>
                    <p style="margin:0 0 8px; font-size:14px; color:#6b7280;">
                      <strong>Email:</strong> ${USER_EMAIL}
                    </p>
                    <p style="margin:0; font-size:14px; color:#6b7280;">
                      <strong>Message:</strong><br/>
                      ${USER_MESSAGE}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center; margin:32px 0;">
                <a href="${REVIEW_URL}"
                  style="
                    display:inline-block;
                    padding:14px 28px;
                    background:#4f46e5;
                    color:#ffffff;
                    font-size:15px;
                    font-weight:600;
                    border-radius:8px;
                    text-decoration:none;
                  ">
                  Review Author Request
                </a>
              </div>

              <p style="color:#6b7280; font-size:13px; line-height:1.6;">
                If this request was not expected, you can safely ignore this email.
              </p>

              <p style="color:#6b7280; font-size:13px;">
                Need assistance? Contact
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5; text-decoration:none;">
                  ${SUPPORT_EMAIL}
                </a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:16px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${YEAR} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}
