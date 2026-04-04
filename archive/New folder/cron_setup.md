# Automation Execution Guide (Cron Setup)

To enable the zero-touch pipeline, the two scripts require automated scheduling. The most robust method for Linux-based servers is using `cron`.

## 1. Prerequisites
Ensure your `.env` file is fully configured inside the execution directory:
```bash
cp .env.example .env
nano .env # Input your actual IMAP credentials
```

Ensure the Python environment has the expected modules:
```bash
pip install pandas openpyxl python-dotenv
```

## 2. Editing the Cron Table
Open the crontab for the user who will own the processes (preferably a service account, or your current user):
```bash
crontab -e
```

## 3. Scheduling the Jobs
Add the following lines. We recommend running the downloader at the top of every hour, and the processor 5 minutes later to ensure all downloads are complete.

*Replace `/path/to/directory` with the absolute path to your scripts.*

```bash
# Every hour at XX:00: Download new emails
0 * * * * cd /path/to/directory && /usr/bin/python3 email_downloader.py >> /path/to/directory/downloader.log 2>&1

# Every hour at XX:05: Process downloaded templates into the master ledger
5 * * * * cd /path/to/directory && /usr/bin/python3 process_inbox.py >> /path/to/directory/processor.log 2>&1
```

## 4. Archiving
Processed templates are moved to the `processed/` folder automatically.
Failed validations are moved to the `failed/` folder (either empty files or files containing malformed unparsable data). 
Administrators should check the `failed/` folder periodically to manually address any misreported Excel templates.
