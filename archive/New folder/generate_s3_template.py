import pandas as pd
from datetime import datetime
import calendar

def generate_s3_template(month=9, year=2025):
    """
    Generates a pre-populated Excel template for Section S3 fuel reporting.
    """
    # Range of machines identified in S3 oil logs
    # OTP-1388 to OTP-1428
    machine_ids = [f"OTP-{i}" for i in range(1388, 1429)]
    
    # Define template columns
    columns = [
        'Date', 
        'Machine ID (Inventar Code)', 
        'Description', 
        'Fuel Quantity (Liters)', 
        'Odometer/Motorhour Reading', 
        'Received By (Signature/Name)',
        'Observation/Site Location'
    ]
    
    # Create an empty DataFrame with these columns
    # We prepopulate with 31 rows (one for each possible day) for EACH machine? 
    # Or just a blank sheet with 200 rows for easier on-site entry.
    # Let's do a blank list first, but maybe add the machine list in a separate reference sheet or dropdown.
    
    data = []
    # Just add some empty rows to start
    for _ in range(200):
        data.append([''] * len(columns))
    
    df = pd.DataFrame(data, columns=columns)
    
    # Create a reference sheet with machine IDs
    ref_df = pd.DataFrame({
        'Authorized Machine IDs (Section S3)': machine_ids
    })
    
    filename = f'S3_Fuel_Reporting_Template_{calendar.month_name[month]}_{year}.xlsx'
    
    with pd.ExcelWriter(filename, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Daily_Fuel_Log', index=False)
        ref_df.to_excel(writer, sheet_name='Machine_Reference', index=False)
        
        workbook = writer.book
        worksheet = writer.sheets['Daily_Fuel_Log']
        
        # Add some formatting
        header_format = workbook.add_format({
            'bold': True,
            'text_wrap': True,
            'valign': 'top',
            'fg_color': '#D7E4BC',
            'border': 1
        })
        
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
            worksheet.set_column(col_num, col_num, 25)

        # Instructions on the sheet
        worksheet.write('I1', 'INSTRUCTIONS:', header_format)
        worksheet.write('I2', '1. Use one row per fueling event.')
        worksheet.write('I3', '2. Ensure Machine ID matches the Reference sheet.')
        worksheet.write('I4', '3. Submit this file by the 5th of every month.')

    print(f"Template generated: {filename}")

if __name__ == "__main__":
    generate_s3_template()
