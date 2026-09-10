import pandas as pd
import os
import glob

def combine_excel_files(source_dir, output_file):
    # Find all .xlsx files in the source directory
    excel_files = glob.glob(os.path.join(source_dir, "*.xlsx"))
    
    # Filter out the output file if it already exists to avoid recursion
    excel_files = [f for f in excel_files if os.path.basename(f) != os.path.basename(output_file)]
    
    if not excel_files:
        print("No Excel files found to combine.")
        return

    all_dataframes = []
    for file in excel_files:
        try:
            df = pd.read_excel(file)
            print(f"Reading: {os.path.basename(file)} ({len(df)} rows)")
            all_dataframes.append(df)
        except Exception as e:
            print(f"Error reading {file}: {e}")

    if all_dataframes:
        # Concatenate all dataframes
        combined_df = pd.concat(all_dataframes, ignore_index=True)
        
        # Save to output file
        combined_df.to_excel(output_file, index=False)
        print(f"\nSuccessfully combined {len(excel_files)} files into {output_file}")
        print(f"Total rows: {len(combined_df)}")
    else:
        print("No data found in the files.")

if __name__ == "__main__":
    source_directory = r"C:\Users\1111\.gemini\antigravity\agents\lead_bot"
    output_path = os.path.join(source_directory, "total_lead.xlsx")
    
    combine_excel_files(source_directory, output_path)
