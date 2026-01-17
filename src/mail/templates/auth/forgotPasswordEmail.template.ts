export default function forgotPasswordEmailTemplate({
  username,
  reset_url,
  expiry_minutes,
  app_name = 'Devshala',
  year,
  app_domain = 'https://devshala.com',
}: {
  username: string;
  reset_url: string;
  expiry_minutes: number;
  app_name?: string;
  year: number;
  app_domain?: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    }

    .email-wrapper {
      width: 100%;
      padding: 40px 0;
      background-color: #f4f6f8;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }

    .email-header {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      padding: 24px;
      text-align: center;
      color: #ffffff;
    }

    .email-header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }

    .email-body {
      padding: 32px;
      color: #374151;
    }

    .email-body p {
      margin: 0 0 16px;
      line-height: 1.6;
      font-size: 15px;
    }

    .btn-container {
      text-align: center;
      margin: 32px 0;
    }

    .reset-btn {
      display: inline-block;
      padding: 14px 28px;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      border-radius: 6px;
      font-size: 15px;
    }

    .reset-btn:hover {
      background-color: #4338ca;
    }

    .email-footer {
      padding: 24px;
      background-color: #f9fafb;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }

    .email-footer p {
      margin: 4px 0;
    }

    .link {
      color: #4f46e5;
      word-break: break-all;
    }

    @media (max-width: 600px) {
      .email-body {
        padding: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      
      <!-- Header -->
      <div class="email-header">
        <h1>Reset Your Password</h1>
      </div>

      <!-- Body -->
      <div class="email-body">
        <p>Hi <strong>${username}</strong>,</p>

        <p>
          We received a request to reset your password. Click the button below to set a new password.
        </p>

        <div class="btn-container">
          <a href="${reset_url}" class="reset-btn">
            Reset Password
          </a>
        </div>

        <p>
          This password reset link will expire in <strong>${expiry_minutes} minutes</strong> for security reasons.
        </p>

        <p>
          If the button above does not work, copy and paste the following link into your browser:
        </p>

        <p class="link">${reset_url}</p>

        <p>
          If you didn’t request a password reset, you can safely ignore this email.
        </p>

        <p>
          Thanks,<br/>
          <strong>The ${app_name} Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <p>© ${year} ${app_name}. All rights reserved.</p>
        <p>If you have any questions, contact us at support@${app_domain}</p>
      </div>

    </div>
  </div>
</body>
</html>
`;
}
