import { env } from '@config/env.js';
export interface IEmailVerificationTemplateParams {
  APP_NAME?: string;
  OTP: string;
  USERNAME: string;
  EXPIRY_MINUTES: number;
  SUPPORT_EMAIL?: string;
  YEAR?: number;
}
export default function emailVerificationEmailTemplate(params: IEmailVerificationTemplateParams) {
  const {
    APP_NAME = 'Devshala',
    OTP,
    USERNAME,
    EXPIRY_MINUTES,
    SUPPORT_EMAIL = env.SUPPORT_EMAIL || 'susovandas985@support.com',
    YEAR = new Date().getFullYear(),
  } = params;
  return `
	<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OTP Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">
        
        <!-- Main Container -->
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#2563eb; padding:20px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;">
              <h2 style="margin-top:0; color:#111827;">
                Hello ${USERNAME},
              </h2>

              <p style="color:#4b5563; font-size:15px; line-height:1.6;">
                We received a request to verify your account.  
                Please use the OTP below to complete the verification process.
              </p>

              <!-- OTP Box -->
              <div style="margin:30px 0; text-align:center;">
                <span style="
                  display:inline-block;
                  background:#f3f4f6;
                  padding:15px 30px;
                  font-size:28px;
                  letter-spacing:6px;
                  font-weight:bold;
                  color:#111827;
                  border-radius:6px;
                ">
                  ${OTP}
                </span>
              </div>

              <p style="color:#4b5563; font-size:14px;">
                This OTP is valid for <strong>${EXPIRY_MINUTES} minutes</strong>.
                Please do not share it with anyone.
              </p>

              <p style="color:#6b7280; font-size:13px; margin-top:30px;">
                If you didn’t request this, you can safely ignore this email.
              </p>

              <p style="color:#6b7280; font-size:13px;">
                Need help? Contact us at
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb; text-decoration:none;">
                  ${SUPPORT_EMAIL}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:15px; text-align:center;">
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
