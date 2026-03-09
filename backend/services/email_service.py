import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")

if not BREVO_API_KEY:
    raise RuntimeError("❌ BREVO_API_KEY is missing from environment variables")

# Configure Brevo client
config = sib_api_v3_sdk.Configuration()
config.api_key['api-key'] = BREVO_API_KEY

email_client = sib_api_v3_sdk.TransactionalEmailsApi(
    sib_api_v3_sdk.ApiClient(config)
)


async def send_email(to_email: str, subject: str, html: str):
    """
    Sends an email using Brevo Transactional Email API.

    Returns True on success, False on failure.
    """

    email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email}],
        sender={"email": "abhirampb9@gmail.com"},  # your verified Gmail
        subject=subject,
        html_content=html
    )

    try:
        response = email_client.send_transac_email(email)
        print(f"📩 Email sent to {to_email} ✔ (Message ID: {response.message_id})")
        return True

    except ApiException as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False
