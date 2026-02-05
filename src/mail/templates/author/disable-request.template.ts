export interface IAccountDisabledTemplate {
  username: string;
  reason: string;
  year?: number;
  support_url?: string;
  privacy_url?: string;
  policy_url?: string;
  website_url?: string;
}
export default function accountDisableTemplate({
  username,
  reason,
  year = new Date().getFullYear(),
  support_url = 'https://devshala.com/support',
  policy_url = 'https://devshala.com/policy',
  website_url = 'https://devshala.com',
}: IAccountDisabledTemplate) {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Disabled</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    }

    table {
      border-collapse: collapse;
    }

    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
    }

    .header {
      background: linear-gradient(135deg, #111827, #374151);
      padding: 28px;
      text-align: center;
      color: #ffffff;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .content {
      padding: 32px;
      color: #374151;
    }

    .content h2 {
      margin-top: 0;
      font-size: 20px;
      color: #111827;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      margin: 14px 0;
    }

    .reason-box {
      background-color: #f8fafc;
      border-left: 4px solid #111827;
      padding: 16px;
      margin: 22px 0;
      border-radius: 6px;
      color: #1f2933;
    }

    .impact-box {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 16px;
      margin: 22px 0;
      border-radius: 6px;
      color: #7f1d1d;
    }

    .cta-button {
      display: inline-block;
      margin-top: 24px;
      padding: 14px 26px;
      background-color: #111827;
      color: #ffffff;
      text-decoration: none;
      font-size: 15px;
      border-radius: 8px;
      font-weight: 500;
    }

    .cta-button:hover {
      background-color: #000000;
    }

    .footer {
      padding: 22px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      background-color: #f9fafb;
    }

    .footer a {
      color: #111827;
      text-decoration: none;
      margin: 0 6px;
    }
  </style>
</head>

<body>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td class="header">
              <h1>Your Account Has Been Disabled</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content">
              <h2>Hello ${username},</h2>

              <p>
                This email is to inform you that your
                <strong>Devshala account has been disabled</strong>.
              </p>

              <!-- Reason -->
              <div class="reason-box">
                <strong>Reason for Disabling:</strong>
                <p style="margin: 8px 0 0;">
                  ${reason}
                </p>
              </div>

              <!-- Impact -->
              <div class="impact-box">
                <p style="margin: 0;">
                  You will no longer be able to log in, access your dashboard,
                  or use any Devshala services while your account remains disabled.
                </p>
              </div>

              <p>
                If you believe this action was taken in error or would like to
                request a review, you may contact our support team.
              </p>

              <a href="${support_url}" class="cta-button">
                Request Account Review
              </a>

              <p style="margin-top: 28px;">
                We take account security and community standards seriously
                and appreciate your cooperation.
              </p>

              <p>
                Sincerely,  
                <br />
                <strong>— Team Devshala</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              © ${year} Devshala. All rights reserved.
              <br />
              <a href="${website_url}">Website</a> ·
              <a href="${support_url}">Support</a> ·
              <a href="${policy_url}">Terms & Policies</a>
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
