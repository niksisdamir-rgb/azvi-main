import pandas as pd
import argparse
import os
import re

def get_s3_machines():
    return [f"OTP-{i}" for i in range(1388, 1429)]

def parse_mehanizacija_for_s2(filepath="MEHANIZACIJA.xlsx"):
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} not found. Returning empty list for S2 machines.")
        return []

    try:
        otp_machines = set()
        df_dict = pd.read_excel(filepath, sheet_name=None)
        
        for sheet_name, df in df_dict.items():
            # Check column names
            for col in df.columns:
                if isinstance(col, str):
                    matches = re.findall(r'OTP-\d+', col)
                    otp_machines.update(matches)
            
            # Check cell values
            for col in df.columns:
                series = df[col].dropna()
                for val in series:
                    if isinstance(val, str):
                        matches = re.findall(r'OTP-\d+', val)
                        otp_machines.update(matches)
                        
        found = sorted(list(otp_machines))
        if found:
            print(f"Found {len(found)} machines in {filepath}")
        else:
            print(f"No OTP-xxx machines found in {filepath}")
        return found
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return []

def create_template(section, month, year, machines, output_file):
    # Create the writer
    writer = pd.ExcelWriter(output_file, engine='xlsxwriter')
    
    # --- Sheet 1: Daily_Fuel_Log ---
    columns = [
        "Date", 
        "Machine ID (Inventar Code)", 
        "Description", 
        "Fuel Quantity (Liters)", 
        "Odometer/Motorhour Reading", 
        "Received By (Signature/Name)", 
        "Observation/Site Location"
    ]
    
    # Create empty dataframe with enough rows for a month
    num_rows = 200
    df_log = pd.DataFrame(index=range(num_rows), columns=columns)
    
    # Add instructions as dummy columns off to the right
    df_log[""] = ""
    df_log["INSTRUCTIONS:"] = ""
    instructions = [
        "1. Fill out this log daily for all fueling events.",
        "2. Machine ID must exact match the Machine_Reference tab.",
        "3. Odometer/Motorhour is MANDATORY for efficiency tracking.",
        f"4. Submit to audit by 5th of next month (Report: {month}/{year}).",
        f"5. Section: {section}"
    ]
    for i, inst in enumerate(instructions):
        if i < num_rows:
            df_log.loc[i, "INSTRUCTIONS:"] = inst

    df_log.to_excel(writer, sheet_name="Daily_Fuel_Log", index=False)
    
    # --- Sheet 2: Machine_Reference ---
    df_ref = pd.DataFrame({
        f"Authorized Machine IDs (Section {section})": machines
    })
    df_ref.to_excel(writer, sheet_name="Machine_Reference", index=False)
    
    # Formatting
    workbook = writer.book
    worksheet_log = writer.sheets["Daily_Fuel_Log"]
    worksheet_ref = writer.sheets["Machine_Reference"]
    
    # Header format
    header_fmt = workbook.add_format({
        'bold': True,
        'bg_color': '#D9EAD3',  # Light green as requested implicitly before/standard
        'border': 1
    })
    
    # Apply to headers
    for col_num, value in enumerate(df_log.columns):
        worksheet_log.write(0, col_num, value, header_fmt)
        worksheet_log.set_column(col_num, col_num, 20)  # Set column width
        
    worksheet_log.set_column(0, 0, 15) # Date
    worksheet_log.set_column(1, 1, 25) # Machine ID
    worksheet_log.set_column(3, 3, 20) # Quantity
    worksheet_log.set_column(4, 4, 30) # Odometer
    worksheet_log.set_column(8, 8, 60) # Instructions

    for col_num, value in enumerate(df_ref.columns):
        worksheet_ref.write(0, col_num, value, header_fmt)
        worksheet_ref.set_column(col_num, col_num, 35)

    writer.close()
    print(f"Successfully generated template: {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Generate Fuel Reporting Template")
    parser.add_argument("--section", type=str, required=True, help="Section name (e.g., S2, Prnjavor, S3)")
    parser.add_argument("--month", type=int, required=True, help="Month (1-12)")
    parser.add_argument("--year", type=int, required=True, help="Year (e.g., 2025)")
    parser.add_argument("--machines", type=str, help="Comma separated list of machines (overrides dynamic extraction)")
    
    args = parser.parse_args()
    
    month_names = {
        1: "January", 2: "February", 3: "March", 4: "April",
        5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
    }
    month_str = month_names.get(args.month, str(args.month))
    
    if args.machines:
        machines = [m.strip() for m in args.machines.split(',')]
    else:
        if args.section.lower() in ['s3', 'prnjavor']:
            machines = get_s3_machines()
        elif args.section.lower() == 's2':
            machines = parse_mehanizacija_for_s2()
            if not machines:
                print("No machines found dynamically for S2. Using a fallback list.")
                # We can fallback to some default if strictly needed
                machines = ["OTP-1001", "OTP-1002"] # placeholder
        else:
            machines = []

    output_file = f"{args.section}_Fuel_Reporting_Template_{month_str}_{args.year}.xlsx"
    create_template(args.section, args.month, args.year, machines, output_file)


if __name__ == "__main__":
    main()
