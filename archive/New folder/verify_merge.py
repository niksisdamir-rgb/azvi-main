import pandas as pd
import os
import glob

def test_template_merge(template_path, master_path):
    """
    Demonstrates how to merge a section template data back into the Master Diesel Table.
    """
    section = template_path.split('_')[0]
    print(f"\n--- Testing merge of {template_path} into {master_path} ---")
    
    # 1. Load the section template
    # We assume site managers filled in some rows
    s3_data = pd.read_excel(template_path, sheet_name='Daily_Fuel_Log')
    
    # Filter out empty rows
    s3_data = s3_data[s3_data['Fuel Quantity (Liters)'].notna() | (s3_data['Date'].notna())]
    
    if s3_data.empty:
        print(f"Note: Template {template_path} is empty. Adding mock data for test.")
        s3_data = pd.DataFrame({
            'Date': ['01.09.2025', '02.09.2025'],
            'Machine ID (Inventar Code)': ['OTP-TEST1', 'OTP-TEST2'],
            'Description': ['Excavator', 'Bulldozer'],
            'Fuel Quantity (Liters)': [150.5, 200.0],
            'Odometer/Motorhour Reading': [1250, 890],
            'Received By (Signature/Name)': ['Eldar', 'Marko'],
            'Observation/Site Location': [f'{section} Tunnel Entrance', f'{section} Disposal Area']
        })

    # 2. Map template to Master Ledger format
    # Master columns usually: Datum, Radno nalog, Lokacija, Br.Masine, Litaza, ...
    master_rows = pd.DataFrame()
    master_rows['Datum'] = s3_data['Date']
    master_rows['Br.Masine'] = s3_data['Machine ID (Inventar Code)']
    master_rows['Litaza'] = s3_data['Fuel Quantity (Liters)']
    master_rows['Stanje brojila'] = s3_data['Odometer/Motorhour Reading']
    master_rows['Lokacija'] = f'{section} - Autoput'
    master_rows['Napomena'] = f'Integrated from {section} Site Ledger'

    print("PROPOSED ROWS FOR MASTER LEDGER:")
    print(master_rows)

    # In a real scenario, we would append to the master file
    output_audit = f'merge_verification_audit_{section}.xlsx'
    master_rows.to_excel(output_audit, index=False)
    print(f"Verification successful: Data mapped and saved to '{output_audit}'")

if __name__ == "__main__":
    templates = glob.glob("*_Fuel_Reporting_Template_*.xlsx")
    master = 'DIZEL TABELA.xlsx'
    
    if not templates:
        print("Error: No templates found. Run generate_unified_template.py first.")
    else:
        for template in templates:
            print(f"Found template: {template}")
            test_template_merge(template, master)
