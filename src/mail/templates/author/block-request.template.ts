export interface IBlockAuthorTemplate {
  author_name: string;
  block_reason: string;
  year?: number;
  website_url?: string;
  support_url?: string;
  privacy_url?: string;
  policy_url?: string;
}
export default function accountBlockTemplate({
  author_name,
  block_reason,
  year = new Date().getFullYear(),
  website_url = 'https://devshala.com',
  support_url = 'https://devshala.com/support',
  privacy_url = 'https://devshala.com/privacy',
  policy_url = 'https://devshala.com/policy',
}: IBlockAuthorTemplate) {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Author Access Restricted</title>

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
      background: linear-gradient(135deg, #dc2626, #ef4444);
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
      background-color: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 16px;
      margin: 20px 0;
      border-radius: 6px;
      color: #7c2d12;
    }

    .alert-box {
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
      background-color: #dc2626;
      color: #ffffff;
      text-decoration: none;
      font-size: 15px;
      border-radius: 8px;
      font-weight: 500;
    }

    .cta-button:hover {
      background-color: #b91c1c;
    }

    .footer {
      padding: 22px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      background-color: #f9fafb;
    }

    .footer a {
      color: #dc2626;
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
              <h1>Author Access Restricted 🚫</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content">
              <h2>Hello ${author_name},</h2>

              <p>
                We’re writing to inform you that your
                <strong>author access on Devshala</strong> has been restricted.
              </p>

              <!-- Reason Section -->
              <div class="reason-box">
                <strong>Reason for Restriction:</strong>
                <p style="margin: 8px 0 0;">
                  ${block_reason}
                </p>
              </div>

              <div class="alert-box">
                <p style="margin: 0;">
                  During this period, you won’t be able to create, edit,
                  or publish content on the platform.
                </p>
              </div>

              <p>
                If you believe this action was taken in error or need
                clarification, you may contact our support team.
              </p>

              <a href="${support_url}" class="cta-button">
                Contact Support
              </a>

              <p style="margin-top: 28px;">
                We appreciate your understanding as we work to maintain
                content quality and community standards.
              </p>

              <p>
                Regards,  
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
              <a href="${policy_url}">Content Policy</a>
              <a href="${privacy_url}">Privacy Policy</a>
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
