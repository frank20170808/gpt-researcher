import os
import json

VERSIONS_FILE = 'workflow_versions.json'

def load_versions():
    if not os.path.exists(VERSIONS_FILE):
        return []
    with open(VERSIONS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_versions(versions):
    with open(VERSIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(versions, f, ensure_ascii=False, indent=2)

@router.post("/api/save-version")
async def save_version(name: str, workflow: dict):
    versions = load_versions()
    versions.append({
        "id": str(uuid.uuid4()),
        "name": name,
        "time": str(asyncio.get_event_loop().time()),
        "workflow": workflow
    })
    save_versions(versions)
    return {"status": "saved"}

@router.get("/api/list-versions")
async def list_versions():
    versions = load_versions()
    return versions

@router.get("/api/load-version")
async def load_version(version_id: str):
    versions = load_versions()
    for v in versions:
        if v['id'] == version_id:
            return v
    return {}

@router.post("/api/delete-version")
async def delete_version(version_id: str):
    versions = load_versions()
    versions = [v for v in versions if v['id'] != version_id]
    save_versions(versions)
    return {"status": "deleted"}
