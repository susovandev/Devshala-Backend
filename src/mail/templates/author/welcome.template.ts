export interface IWelcomeTemplate {
  dashboard_url: string;
  year?: number;
  website_url?: string;
  support_url?: string;
  privacy_url?: string;
}
export default function welcomeTemplate({
  dashboard_url,
  year = new Date().getFullYear(),
  website_url = 'https://devshala.com',
  support_url = 'https://devshala.com/support',
  privacy_url = 'https://devshala.com/privacy',
}: IWelcomeTemplate): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Devshala</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
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
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .header {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
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

    .highlight-box {
      background-color: #f9fafb;
      border-left: 4px solid #4f46e5;
      padding: 16px;
      margin: 22px 0;
      border-radius: 6px;
    }

    .cta-button {
      display: inline-block;
      margin-top: 24px;
      padding: 14px 28px;
      background-color: #4f46e5;
      color: #ffffff;
      text-decoration: none;
      font-size: 15px;
      border-radius: 8px;
      font-weight: 500;
    }

    .cta-button:hover {
      background-color: #4338ca;
    }

    .footer {
      padding: 22px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      background-color: #f9fafb;
    }

    .footer a {
      color: #4f46e5;
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
              <h1>Welcome to Devshala 🎉</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content">
              <h2>You’re officially an Author!</h2>

              <p>
                We’re excited to let you know that you’ve been added as an
                <strong>Author</strong> on <strong>Devshala</strong>.
              </p>

              <div class="highlight-box">
                <p style="margin: 0;">
                  As an author, you can now create, edit, and publish
                  high-quality technical content to help developers learn and grow.
                </p>
              </div>

              <p>
                Your voice matters. Share your knowledge, tutorials, insights,
                and real-world experiences with our growing developer community.
              </p>

              <a href="${dashboard_url}" class="cta-button">
                Go to  Dashboard →
              </a>

              <p style="margin-top: 28px;">
                If you have any questions or need help getting started, our team is
                always here for you.
              </p>

              <p>
                Happy writing ✍️  
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
