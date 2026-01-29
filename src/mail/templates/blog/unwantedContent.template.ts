export function blogUnwantedContentTemplate({
  AUTHOR_NAME,
  PLATFORM_NAME = 'DevShala',
  reason,
  redirectLink,
  YEAR = new Date().getFullYear(),
}: {
  AUTHOR_NAME: string;
  PLATFORM_NAME?: string;
  reason: string;
  redirectLink: string;
  YEAR?: number;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Blog Review Update</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .email-wrapper {
      width: 100%;
      padding: 40px 0;
    }

    .email-card {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .email-header {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      padding: 28px;
      text-align: center;
      color: #ffffff;
    }

    .email-header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
    }

    .email-body {
      padding: 32px;
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
    }

    .email-body p {
      margin: 0 0 16px;
    }

    .reason-box {
      background: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 18px;
      border-radius: 10px;
      margin: 24px 0;
    }

    .reason-box h3 {
      margin: 0 0 8px;
      font-size: 15px;
      color: #9a3412;
    }

    .reason-box ul {
      margin: 0;
      padding-left: 18px;
    }

    .reason-box li {
      margin-bottom: 6px;
      color: #7c2d12;
    }

    .cta-button {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 22px;
      background: #6366f1;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      border-radius: 10px;
      font-size: 14px;
    }

    .email-footer {
      padding: 24px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">

      <!-- Header -->
      <div class="email-header">
        <h1>Blog Review Update</h1>
      </div>

      <!-- Body -->
      <div class="email-body">
        <p>Hi <strong>${AUTHOR_NAME}</strong>,</p>

        <p>
          Thank you for submitting your blog to <strong>${PLATFORM_NAME}</strong>.
          We appreciate the effort you put into writing and sharing your thoughts.
        </p>

        <p>
          After careful review, we’re unable to publish this blog at the moment.
          Below is a clear explanation to help you understand our decision.
        </p>

        <!-- Reason Section -->
        <div class="reason-box">
          <h3>Why this blog isn’t publishable</h3>
          <b>${reason}</b>
        </div>

        <p>
          This doesn’t reflect the quality of your writing — it’s purely about
          <strong>content alignment</strong> with our platform.
        </p>

        <p>
          You’re welcome to revise the article or submit a new blog that better fits
          our tech-focused publishing standards.
        </p>

        <a href="${redirectLink}" class="cta-button">
          Submit a New Blog
        </a>

        <p style="margin-top: 28px;">
          If you need clarification or guidance on acceptable topics, feel free to reply.
          We’d be happy to help 🙂
        </p>

        <p>
          Best regards,<br />
          <strong>${PLATFORM_NAME} Editorial Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        © ${YEAR} ${PLATFORM_NAME}. All rights reserved.
      </div>

    </div>
  </div>
</body>
</html>
`;
}
