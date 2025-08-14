import json
from datetime import datetime, date
import shutil

COMMON_DATE_KEYS = [
    "Date",
    "date",
    "Publication date",
    "publication date",
    "Publication Date",
    "publication_date",
    "Publication_Date",
    "pub_date",
    "PublicationDate",
]

def parse_date(date_str):
    if not date_str or not isinstance(date_str, str):
        return None
    s = date_str.strip()
    if not s:
        return None

    # Normaliza separadores
    s = s.replace("/", "-").replace(".", "-")

    formatos = [
        "%Y-%m-%d",
        "%Y-%m",
        "%Y",
        "%d-%m-%Y",
        "%m-%d-%Y",
    ]

    for fmt in formatos:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.date()
        except Exception:
            continue

    try:
        dt = datetime.fromisoformat(s)
        return dt.date()
    except Exception:
        pass

    return None

def get_date_from_study(study):
    for key in COMMON_DATE_KEYS:
        if key in study and study.get(key):
            parsed = parse_date(str(study.get(key)))
            if parsed:
                return parsed
    for k, v in study.items():
        if "date" in str(k).lower() and v:
            parsed = parse_date(str(v))
            if parsed:
                return parsed
    return None

def clean_primary_studies(filename, exclude_before=None, exclude_after=None, remove_if_no_date=False):
    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    primary_key = "primary_studies"
    if primary_key not in data:
        raise ValueError("Não encontrei 'primary_studies' no JSON.")

    studies = data[primary_key]
    print(f"Loaded {len(studies)} studies.")

    # Faz backup
    backup_name = f"{filename}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    shutil.copy2(filename, backup_name)
    print(f"Backup criado: {backup_name}")

    filtered = []
    removed_copyright = 0
    removed_date = 0
    removed_no_date = 0

    for study in studies:
        abstract = str(study.get("Abstract", "")).strip()

        if abstract == "REMOVED TO COMPLY WITH COPYRIGHT":
            removed_copyright += 1
            continue

        study_date = get_date_from_study(study)

        if study_date is None:
            if remove_if_no_date:
                removed_no_date += 1
                continue
            else:
                filtered.append(study)
                continue

        if exclude_before and study_date < exclude_before:
            removed_date += 1
            continue

        if exclude_after and study_date > exclude_after:
            removed_date += 1
            continue

        filtered.append(study)

    data[primary_key] = filtered
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Finished cleaning.")
    print(f"Removed due to copyright: {removed_copyright}")
    print(f"Removed due to date filter: {removed_date}")
    print(f"Removed due to missing date: {removed_no_date}")
    print(f"Remaining: {len(filtered)}")

if __name__ == "__main__":
    json_filename = input("Enter the JSON filename (with extension): ").strip()

    exclude_before_input = input("Exclude studies BEFORE date (YYYY-MM-DD)? Leave empty to skip: ").strip()
    exclude_after_input = input("Exclude studies AFTER date (YYYY-MM-DD)? Leave empty to skip: ").strip()
    remove_if_no_date_input = input("Remove studies with NO date? (yes/no): ").strip().lower()

    exclude_before = parse_date(exclude_before_input) if exclude_before_input else None
    exclude_after = parse_date(exclude_after_input) if exclude_after_input else None
    remove_if_no_date = remove_if_no_date_input in ["yes", "y"]

    clean_primary_studies(
        json_filename,
        exclude_before=exclude_before,
        exclude_after=exclude_after,
        remove_if_no_date=remove_if_no_date
    )
