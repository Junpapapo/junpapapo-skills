#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync User Feedback (VOC) from Google Sheets Web App to local feedback_manifest.js
Usage:
    python scripts/sync_feedback.py
"""

import os
import sys
import json
import urllib.request

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

DEFAULT_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"

def find_project_root():
    curr = os.path.abspath(os.path.dirname(__file__))
    while curr != os.path.dirname(curr):
        if os.path.exists(os.path.join(curr, "package.json")) or os.path.exists(os.path.join(curr, ".git")):
            return curr
        curr = os.path.dirname(curr)
    return os.getcwd()

def find_tracker_dir(project_root):
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
        os.path.join(project_root, "docs", "02_Guides", "internal_qa_issue_tracker"),
        os.path.join(project_root, "qa_tracker"),
        os.path.join(project_root, "qa")
    ]
    for c in candidates:
        if os.path.isdir(c) and os.path.exists(os.path.join(c, "data")):
            return c
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def get_webhook_url(project_root, tracker_dir):
    # 1. Try reading from .env file in project root
    env_path = os.path.join(project_root, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass

    # 2. Try reading from tracker_dir/.qa_config.json
    qa_json_path = os.path.join(tracker_dir, ".qa_config.json")
    if os.path.exists(qa_json_path):
        try:
            with open(qa_json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                api_url = data.get("api", {}).get("sheetSyncUrl")
                if api_url and api_url.strip():
                    return api_url.strip()
        except Exception:
            pass

    # 3. Try reading from tracker_dir/data/qa_config.js
    qa_js_path = os.path.join(tracker_dir, "data", "qa_config.js")
    if os.path.exists(qa_js_path):
        try:
            with open(qa_js_path, "r", encoding="utf-8") as f:
                import re
                content = f.read()
                m = re.search(r'sheetSyncUrl\s*:\s*["\']([^"\']+)["\']', content)
                if m and m.group(1).strip():
                    return m.group(1).strip()
        except Exception:
            pass

    return DEFAULT_URL

def main():
    project_root = find_project_root()
    tracker_dir = find_tracker_dir(project_root)
    url = get_webhook_url(project_root, tracker_dir)

    if "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE" in url:
        print("[ERROR] Google Apps Script Web App URL is not configured.")
        print("Please configure EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL in your .env or specify target URL.")
        sys.exit(1)

    print(f"🔄 Fetching latest VOC feedback from Google Sheets:")
    print(f"   URL: {url}")
    
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Universal-QA-Sync-CLI/1.0"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
    except Exception as e:
        print(f"❌ Failed to fetch from Google Sheets: {e}")
        sys.exit(1)
        
    if not isinstance(data, dict) or data.get("status") != "success":
        print(f"❌ Invalid response from Google Sheets API: {data}")
        sys.exit(1)
        
    feedbacks = data.get("data", [])
    count = len(feedbacks)
    print(f"✅ Received {count} feedback item(s) from Google Sheets.")
    
    target_path = os.path.join(tracker_dir, "data", "feedback_manifest.js")
    
    formatted_json = json.dumps(feedbacks, ensure_ascii=False, indent=2)
    file_content = f"""/**
 * Universal User Feedback & VOC Manifest (data/feedback_manifest.js)
 * Synchronized automatically from Google Sheets.
 * Total Items: {count}
 */

window.UNIVERSAL_QA = window.UNIVERSAL_QA || {{}};
window.MODO_FEEDBACK_DATA = window.UNIVERSAL_QA.FEEDBACK = {formatted_json};
"""

    try:
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(file_content)
        print(f"💾 Local file successfully updated: {target_path}")
        print("🎉 Local environment is now 100% in sync with Google Sheets!")
    except Exception as e:
        print(f"❌ Failed to write local manifest: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
