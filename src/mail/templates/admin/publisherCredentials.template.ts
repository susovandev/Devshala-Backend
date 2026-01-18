export interface IPublisherMailTemplate {
  publisherName: string;
  email: string;
  password: string;
  loginUrl: string;
  year: number;
  appName: string;
  supportEmail: string;
}
export function sendPublisherCredentialsMailTemplate(params: IPublisherMailTemplate) {
  const { publisherName, email, password, loginUrl, year, appName, supportEmail } = params;
  return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Publisher Account Credentials</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, Helvetica, Arial, sans-serif;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="background-color: #f4f6f8; padding: 40px 0"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              max-width: 600px;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="
                  background: linear-gradient(135deg, #4f46e5, #6366f1);
                  padding: 24px 32px;
                  color: #ffffff;
                "
              >
                <h1
                  style="
                    margin: 0;
                    font-size: 22px;
                    font-weight: 600;
                  "
                >
                  Welcome to <strong>${appName}</strong>
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9">
                  Your publisher account has been created
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px">
                <p style="margin: 0 0 16px; font-size: 15px; color: #111827">
                  Hi <strong>${publisherName}</strong>,
                </p>

                <p
                  style="
                    margin: 0 0 20px;
                    font-size: 14px;
                    color: #374151;
                    line-height: 1.6;
                  "
                >
                  An administrator has created a publisher account for you on
                  <strong>${appName}</strong>. You can log in using the
                  credentials below.
                </p>

                <!-- Credentials Box -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 24px;
                  "
                >
                  <tr>
                    <td style="padding: 16px">
                      <p
                        style="
                          margin: 0 0 8px;
                          font-size: 13px;
                          color: #6b7280;
                        "
                      >
                        Email
                      </p>
                      <p
                        style="
                          margin: 0 0 16px;
                          font-size: 14px;
                          color: #111827;
                          font-weight: 500;
                        "
                      >
                        ${email}
                      </p>

                      <p
                        style="
                          margin: 0 0 8px;
                          font-size: 13px;
                          color: #6b7280;
                        "
                      >
                        Temporary Password
                      </p>
                      <p
                        style="
                          margin: 0;
                          font-size: 14px;
                          color: #111827;
                          font-weight: 500;
                        "
                      >
                        ${password}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="margin-bottom: 24px"
                >
                  <tr>
                    <td align="center">
                      <a
                        href="${loginUrl}"
                        target="_blank"
                        style="
                          display: inline-block;
                          background-color: #4f46e5;
                          color: #ffffff;
                          padding: 12px 24px;
                          font-size: 14px;
                          font-weight: 500;
                          text-decoration: none;
                          border-radius: 8px;
                        "
                      >
                        Login to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Security Notice -->
                <p
                  style="
                    margin: 0;
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.6;
                  "
                >
                  🔒 For security reasons, please log in and change your
                  password immediately. If you did not expect this email, you
                  can safely ignore it.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 20px 32px;
                  background-color: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0;
                    font-size: 12px;
                    color: #9ca3af;
                  "
                >
                  © ${year} ${appName}. All rights reserved.
                </p>
                <p
                  style="
                    margin: 0;
                    font-size: 12px;
                    color: #9ca3af;
                  "
                >
                  <a
                    href="mailto:${supportEmail}"
                    target="_blank"
                    style="color: #9ca3af"
                  >
                    ${supportEmail}
                  </a>
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
