export interface IBlockAuthorTemplate {
  username: string;
  login_url: string;
  year?: number;
  website_url?: string;
  support_url?: string;
  privacy_url?: string;
  policy_url?: string;
}
export default function accountActivateTemplate({
  username,
  login_url,
  year = new Date().getFullYear(),
  website_url = 'https://devshala.com',
  support_url = 'https://devshala.com/support',
  policy_url = 'https://devshala.com/privacy',
}: IBlockAuthorTemplate) {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Activated</title>

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
      background: linear-gradient(135deg, #16a34a, #22c55e);
      padding: 28px;
      text-align: center;
      color: #ffffff;
    }

    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 600;
    }

    .content {
      padding: 32px;
      color: #374151;
    }

    .content h2 {
      margin-top: 0;
      font-size: 22px;
      color: #111827;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      margin: 14px 0;
    }

    .success-box {
      background-color: #ecfdf5;
      border-left: 4px solid #16a34a;
      padding: 16px;
      margin: 22px 0;
      border-radius: 6px;
      color: #065f46;
    }

    .cta-button {
      display: inline-block;
      margin-top: 24px;
      padding: 14px 28px;
      background-color: #16a34a;
      color: #ffffff;
      text-decoration: none;
      font-size: 15px;
      border-radius: 8px;
      font-weight: 500;
    }

    .cta-button:hover {
      background-color: #15803d;
    }

    .footer {
      padding: 22px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      background-color: #f9fafb;
    }

    .footer a {
      color: #16a34a;
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
              <h1>Your Account Is Now Active 🎉</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content">
              <h2>Hello ${username},</h2>

              <p>
                Great news! Your <strong>Devshala account has been successfully activated</strong>.
              </p>

              <div class="success-box">
                <p style="margin: 0;">
                  You now have full access to the platform and can start exploring
                  features, content, and tools right away.
                </p>
              </div>

              <p>
                Whether you’re here to learn, build, or share knowledge,
                we’re excited to have you as part of the Devshala community.
              </p>

              <a href="${login_url}" class="cta-button">
                Go to Dashboard →
              </a>

              <p style="margin-top: 28px;">
                If you need any help getting started, feel free to reach out to our
                support team anytime.
              </p>

              <p>
                Welcome aboard 🚀  
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
