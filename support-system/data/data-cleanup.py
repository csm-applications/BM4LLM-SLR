import json
from datetime import datetime

def clean_primary_studies(filename, exclude_before=None, exclude_after=None):
    # Load the JSON data from file
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data.get('primary_studies', []))} studies.")

    def parse_date(date_str):
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            return None

    filtered_primary_studies = []
    removed_due_to_copyright = 0
    removed_due_to_date = 0

    for study in data.get("primary_studies", []):
        abstract = study.get("Abstract", "").strip()
        study_date_str = study.get("Date", "").strip()
        study_date = parse_date(study_date_str)

        # Skip studies with copyright issues
        if abstract == "REMOVED TO COMPLY WITH COPYRIGHT":
            removed_due_to_copyright += 1
            continue

        # Check exclude_before date
        if exclude_before and study_date:
            if study_date < exclude_before:
                removed_due_to_date += 1
                continue

        # Check exclude_after date
        if exclude_after and study_date:
            if study_date > exclude_after:
                removed_due_to_date += 1
                continue

        filtered_primary_studies.append(study)

    # Update data and overwrite the file
    data["primary_studies"] = filtered_primary_studies
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"Finished cleaning. Removed {removed_due_to_copyright} due to copyright issues.")
    print(f"Removed {removed_due_to_date} due to date filtering.")
    print(f"Remaining studies: {len(filtered_primary_studies)}")

if __name__ == "__main__":
    json_filename = input("Enter the JSON filename (with extension): ")

    exclude_before_input = input("Exclude studies BEFORE date (YYYY-MM-DD)? Leave empty to skip: ").strip()
    exclude_after_input = input("Exclude studies AFTER date (YYYY-MM-DD)? Leave empty to skip: ").strip()

    exclude_before = datetime.strptime(exclude_before_input, "%Y-%m-%d") if exclude_before_input else None
    exclude_after = datetime.strptime(exclude_after_input, "%Y-%m-%d") if exclude_after_input else None

    clean_primary_studies(json_filename, exclude_before=exclude_before, exclude_after=exclude_after)
