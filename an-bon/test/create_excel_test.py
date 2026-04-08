import pandas as pd
import os

# Sample data
data = {
    'Name': ['Kim', 'Lee', 'Park', 'Choi'],
    'Age': [25, 30, 35, 40],
    'Department': ['HR', 'Engineering', 'Sales', 'Marketing'],
    'Salary': [50000, 80000, 70000, 60000]
}

# Create DataFrame
df = pd.DataFrame(data)

# File path
output_file = 'sample_output.xlsx'

try:
    # Save to Excel
    df.to_excel(output_file, index=False, engine='openpyxl')
    print(f"Success! Excel file created at: {os.path.abspath(output_file)}")
except Exception as e:
    print(f"Error creating Excel file: {e}")
