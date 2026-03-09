from core.config import settings

def password_setup_email(name, token):
    return f"""
        <h2>Hello {name}, 🎓</h2>
        <p>Your Smart Student Hub account has been created.</p>
        <p>Please click the link below to set your password:</p>

        <a href="http://localhost:3000/setup-password?token={token}">
            Set Password
        </a>

        <p>This link expires in 24 hours.</p>
    """

def build_password_email(name: str, reset_token: str) -> str:
    """
    Builds HTML email for password setup / reset
    """

    reset_link = f"{settings.frontend_URL}/set-password?token={reset_token}"

    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello {name},</h2>

        <p>
          Your Smart Student Hub account has been created or updated.
        </p>

        <p>
          Click the button below to set your password:
        </p>

        <p style="margin: 20px 0;">
          <a href="{reset_link}"
             style="
               background-color: #4f46e5;
               color: #ffffff;
               padding: 10px 16px;
               text-decoration: none;
               border-radius: 6px;
               display: inline-block;
             ">
            Set Password
          </a>
        </p>

        <p>
          This link is valid for <b>24 hours</b> and can be used only once.
        </p>

        <p>
          If you did not request this, please ignore this email.
        </p>

        <br />
        <p>
          Regards,<br />
          <b>Smart Student Hub Team</b>
        </p>
      </body>
    </html>
    """