import pandas as pd
import shutil
import os

# Create mock populated templates
sections = ['S2', 'S3', 'Prnjavor']

for s in sections:
    filename = f"{s}_Fuel_Reporting_Template_September_2025.xlsx"
    if os.path.exists(filename):
        shutil.copy(filename, f"inbox/{filename}")
        
        # Open and put mock data
        with pd.ExcelWriter(f"inbox/{filename}", engine='openpyxl') as writer:
            data = {
                'Date': ['01.09.2025', '02.09.2025'],
                'Machine ID (Inventar Code)': ['OTP-TEST1', 'OTP-TEST2'],
                'Description': ['Bager', 'Kamion'],
                'Fuel Quantity (Liters)': [100.5, 50.0],
                'Odometer/Motorhour Reading': [1234, 1240],
                'Received By (Signature/Name)': ['Marko', 'Jovan']
            }
            df = pd.DataFrame(data)
            df.to_excel(writer, sheet_name='Daily_Fuel_Log', index=False)
            
            # Machine ref sheet
            ref = pd.DataFrame({'Machine ID (Inventar Code)': ['OTP-TEST1', 'OTP-TEST2']})
            ref.to_excel(writer, sheet_name='Machine_Reference', index=False)

print("Mock files prepared in inbox/")
