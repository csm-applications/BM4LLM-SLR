import os
import csv
import json

BASE_DIR = '.'  # ou defina o caminho onde estão as pastas 1 a 14
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

# Garante que a pasta de saída existe
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Itera sobre as pastas 1 a 14
for i in range(1, 15):
    folder_name = str(i)
    folder_path = os.path.join(BASE_DIR, folder_name)

    # Caminhos dos arquivos CSV
    secondary_csv_path = os.path.join(folder_path, 'secondary_study_data.csv')
    primary_csv_path = os.path.join(folder_path, 'primary_study_data.csv')

    if not os.path.exists(secondary_csv_path) or not os.path.exists(primary_csv_path):
        print(f"Arquivos não encontrados na pasta {folder_name}. Pulando.")
        continue

    # Lê o secondary_study_data.csv (deve ter apenas uma linha de dados)
    with open(secondary_csv_path, newline='', encoding='utf-8') as sec_file:
        sec_reader = csv.DictReader(sec_file)
        secondary_data = next(sec_reader)  # Assume só um secondary por pasta

    # Lê todos os primary_study_data.csv
    with open(primary_csv_path, newline='', encoding='utf-8') as pri_file:
        pri_reader = csv.DictReader(pri_file)
        primary_studies = [row for row in pri_reader]

    # Cria estrutura final
    result = {
        "secondary_study": secondary_data,
        "primary_studies": primary_studies
    }

    # Escreve o JSON
    output_path = os.path.join(OUTPUT_DIR, f"{folder_name}.json")
    with open(output_path, 'w', encoding='utf-8') as out_file:
        json.dump(result, out_file, ensure_ascii=False, indent=2)

    print(f"✅ JSON salvo: {output_path}")
