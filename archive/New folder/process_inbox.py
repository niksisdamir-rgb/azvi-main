import pandas as pd
import os
import glob
import shutil
import openpyxl
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

INBOX_DIR = os.getenv("INBOX_DIR", "inbox")
PROCESSED_DIR = os.getenv("PROCESSED_DIR", "processed")
FAILED_DIR = os.getenv("FAILED_DIR", "failed")
MASTER_LEDGER = os.getenv("MASTER_LEDGER", "DIZEL TABELA.xlsx")

def append_to_excel(master_path, df_new):
    """Appends mapping data to an existing excel without destroying its format"""
    wb = openpyxl.load_workbook(master_path)
    # We assume 'Sheet1' or the active sheet
    ws = wb.active
    
    for row in df_new.itertuples(index=False):
        # The columns we want are: 
        # A: Date, B: (Skip - Radni Nalog), C: Lokacija, D: Machine, E: Liters, F: Odometer, G: Received By, ... J/K: Napomena
        # Assuming typical column layout for DIZEL TABELA
        # Col 1: Datum, Col 2: Radni nalog, Col 3: Lokacija, Col 4: Br Masine, Col 5: Litaza, Col 6: Stanje brojila, Col 7: Primio
        ws.append([
            row.Datum,
            row.Radno_nalog,
            row.Lokacija,
            row.Br_Masine,
            row.Litaza,
            row.Stanje_brojila,
            row.Primio, # Usually G
            '', # H
            '', # I
            row.Napomena # J/K
        ])
    
    wb.save(master_path)

def process_inbox():
    """Scans the inbox directory, validates templates, and appends to the master ledger."""
    
    os.makedirs(INBOX_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(FAILED_DIR, exist_ok=True)

    inbox_files = glob.glob(os.path.join(INBOX_DIR, "*.xlsx"))
    
    if not inbox_files:
        print("Inbox is empty. No files to process.")
        return

    if not os.path.exists(MASTER_LEDGER):
        print(f"Error: Master ledger '{MASTER_LEDGER}' not found.")
        return

    print(f"Found {len(inbox_files)} file(s) in inbox. Processing...")

    success_count = 0
    fail_count = 0

    for file_path in inbox_files:
        filename = os.path.basename(file_path)
        print(f"\nEvaluating: {filename}")
        
        try:
            section = filename.split('_')[0]
            template_df = pd.read_excel(file_path, sheet_name='Daily_Fuel_Log')
            
            # Filter empty rows
            template_df = template_df[template_df['Fuel Quantity (Liters)'].notna() | (template_df['Date'].notna())]
            
            if template_df.empty:
                print(f"  -> File '{filename}' is empty. Moving to processed.")
                shutil.move(file_path, os.path.join(PROCESSED_DIR, filename))
                continue

            # Map to Master Ledger format
            mapped_rows = pd.DataFrame()
            mapped_rows['Datum'] = pd.to_datetime(template_df['Date'], errors='coerce', dayfirst=True).dt.strftime('%m/%d/%Y')
            mapped_rows['Radno_nalog'] = '' 
            mapped_rows['Lokacija'] = f'{section} - Autoput'
            mapped_rows['Br_Masine'] = template_df['Machine ID (Inventar Code)']
            mapped_rows['Litaza'] = template_df['Fuel Quantity (Liters)']
            mapped_rows['Stanje_brojila'] = template_df['Odometer/Motorhour Reading']
            mapped_rows['Primio'] = template_df['Received By (Signature/Name)']
            mapped_rows['Napomena'] = f'Auto-integrated via email ({filename})'

            mapped_rows = mapped_rows.dropna(subset=['Br_Masine', 'Litaza'])

            if mapped_rows.empty:
                 print(f"  -> Extracted data was invalid (missing critical fields). Moving to failed.")
                 shutil.move(file_path, os.path.join(FAILED_DIR, filename))
                 fail_count += 1
                 continue

            print(f"  -> Mapped {len(mapped_rows)} rows. Appending to master ledger via openpyxl...")
            
            append_to_excel(MASTER_LEDGER, mapped_rows)
            
            shutil.move(file_path, os.path.join(PROCESSED_DIR, filename))
            success_count += 1
            print(f"  -> Success: '{filename}' processed.")

        except Exception as e:
            print(f"  -> Failed to process '{filename}': {e}")
            try:
                shutil.move(file_path, os.path.join(FAILED_DIR, filename))
            except Exception as move_err:
                 pass
            fail_count += 1

    print(f"\nProcessing Complete: {success_count} success, {fail_count} failed.")

if __name__ == "__main__":
    process_inbox()
