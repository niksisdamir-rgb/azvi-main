import imaplib
import email
import os
from email.header import decode_header
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

IMAP_SERVER = os.getenv("IMAP_SERVER")
IMAP_PORT = int(os.getenv("IMAP_PORT", 993))
IMAP_USER = os.getenv("IMAP_USERNAME")
IMAP_PASS = os.getenv("IMAP_PASSWORD")
INBOX_DIR = os.getenv("INBOX_DIR", "inbox")

def clean_filename(filename):
    """Clean filename by removing newlines and carriage returns, decoding if needed."""
    if filename:
        decoded_parts = decode_header(filename)
        cleaned_parts = []
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                cleaned_parts.append(part.decode(encoding or 'utf-8', errors='ignore'))
            else:
                cleaned_parts.append(part)
        clean_name = ''.join(cleaned_parts)
        return clean_name.replace('\r', '').replace('\n', '')
    return filename

def download_templates():
    """Connects to IMAP, searches for unseen emails with Fuel Reporting Templates, and downloads them."""
    
    if not all([IMAP_SERVER, IMAP_USER, IMAP_PASS]):
        print("Please configure IMAP credentials in the .env file.")
        return

    # Ensure output directory exists
    os.makedirs(INBOX_DIR, exist_ok=True)

    try:
        print(f"Connecting to {IMAP_SERVER}...")
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(IMAP_USER, IMAP_PASS)
        mail.select("inbox")

        # Search for UNSEEN emails
        status, messages = mail.search(None, 'UNSEEN')
        
        if status != 'OK':
            print("No new emails found.")
            return

        email_ids = messages[0].split()
        if not email_ids:
            print("No unread emails.")
            return

        print(f"Found {len(email_ids)} unread email(s). Processing...")

        for e_id in email_ids:
            res, msg_data = mail.fetch(e_id, '(RFC822)')
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    
                    # Extract attachments
                    for part in msg.walk():
                        if part.get_content_maintype() == 'multipart':
                            continue
                        if part.get('Content-Disposition') is None:
                            continue
                        
                        filename = part.get_filename()
                        filename = clean_filename(filename)
                        
                        # We only care about Excel templates
                        if filename and filename.endswith('.xlsx') and "Fuel_Reporting_Template" in filename:
                            filepath = os.path.join(INBOX_DIR, filename)
                            
                            # Save attachment
                            with open(filepath, 'wb') as f:
                                f.write(part.get_payload(decode=True))
                                
                            print(f"Downloaded: {filename}")
            
            # Optionally mark as seen after processing (it is done automatically by fetch, but can be done manually)
            # mail.store(e_id, '+FLAGS', '\SEEN')

        mail.logout()
        print("Finished downloading attachments.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    download_templates()
