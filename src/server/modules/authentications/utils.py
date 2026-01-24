import os
import random
import ssl
import traceback
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from global_src.db import DATABASE
from modules.authentications.data_classes import SaltHash
from dotenv import load_dotenv
load_dotenv()


async def insert_email(email: str,
                       username: str,
                       display_name: str,
                       password: str,
                       language: str=None,
                       avatar_url: str=None,
                        bio: str=None
                       ) -> bool:
    """Insert email into the email list for newsletters or notifications"""
    try:
        password_obj = SaltHash.create_salt_hash(password)
        verification_code = "".join(str(random.randint(0, 9)) for _ in range(6))

        await DATABASE.execute(
            """INSERT INTO EmailVerifications 
                   (email, verification_code, username, display_name, language, avatar_url, bio, password_hash, salt)
            VALUES(?,?,?,?,?,?,?,?,?)""",
            (email, verification_code, username, display_name, language, avatar_url, bio, password_obj.hash_value, password_obj.salt)
        )
        await send_email(email=email,verification_code=verification_code)
        return True
    except Exception as e:
        traceback.print_exc()
        print(f"Error inserting email: {e}")
        return False


async def send_email(email: str, verification_code: str) -> bool:
    """Send verification email to the user"""
    try:
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = os.getenv("SMTP_PORT")
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("APP_PASSWORD")
        subject = f"SGEN account verification"
        body = (f"Your OTP for SGEN is: \n{verification_code}\n Please use this code to verify your email address.\n"
                f"Do NOT share this code with anyone.")

        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))
        context = ssl.create_default_context()

        try:
            async with aiosmtplib.SMTP(
                    hostname=smtp_server,
                    port=int(smtp_port),
                tls_context=context
            ) as smtp:
                await smtp.login(sender_email, sender_password)
                await smtp.sendmail(sender_email, email, message.as_string())
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    except Exception as e:
        traceback.print_exc()
        print(e)

if __name__ == "__main__":
    import asyncio
    async def main():
        email = "ryankgithub@gmail.com"
        verification_code = "123456"
        success = await send_email(email, verification_code)
        if success:
            print("Email sent successfully")
        else:
            print("Failed to send email")
    asyncio.run(main())
