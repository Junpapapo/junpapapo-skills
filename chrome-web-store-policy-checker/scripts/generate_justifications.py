#!/usr/bin/env python3
"""
Chrome Web Store Justification Statement Generator (generate_justifications.py)
Generates high-compliance, policy-aligned English justification texts for Chrome Web Store
Developer Dashboard permission submissions.
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any

# Windows Unicode stdout safety
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

STANDARD_JUSTIFICATIONS = {
    "storage": "Used solely to persist user settings, preferences, and local application state locally on the user's device without transmitting any personal data externally.",
    "tabs": "Required to detect current active tab URLs for domain-specific automation and to coordinate content script messaging strictly within user-initiated actions.",
    "activeTab": "Used to temporarily access the currently active tab when the user explicitly clicks the extension action icon, enabling interactive on-page features without requiring broad host permissions.",
    "alarms": "Used to schedule periodic background sync tasks, routine cache cleanup, and reminders without keeping the service worker continuously awake.",
    "contextMenus": "Used to add dedicated right-click context menu options for quick access to extension features directly from web pages.",
    "notifications": "Used to display timely desktop notifications to the user upon task completion, timer events, or important background status updates.",
    "scripting": "Required to programmatically inject scoped stylesheet rules and content script modules into permitted domains strictly based on user interaction.",
    "cookies": "Required to read session authentication state and cookies strictly for the permitted domain to verify user login status seamlessly.",
    "declarativeNetRequest": "Used to modify request headers and block tracking scripts locally using privacy-preserving Declarative Net Request rules.",
    "bookmarks": "Required to organize and manage browser bookmarks based on direct user commands.",
    "history": "Used strictly to search and display recent relevant history items inside the extension popup UI with zero external tracking."
}

def generate_justifications(manifest_path: Path, ext_name: str) -> str:
    data = json.loads(manifest_path.read_text(encoding="utf-8", errors="ignore"))
    name = ext_name or data.get("name", "This extension")
    perms = data.get("permissions", [])
    host_perms = data.get("host_permissions", [])

    out = []
    out.append(f"# 🛡️ Chrome Web Store Permission Justifications for `{name}`")
    out.append("")
    out.append("> Copy and paste these statements into the Chrome Web Store Developer Dashboard under the 'Privacy practices' tab.")
    out.append("")
    out.append("---")
    out.append("")
    out.append("## 1. Single Purpose Description")
    out.append(f"**Single Purpose Statement**:")
    out.append(f"> {name} provides a focused, streamlined browser productivity utility designed to enhance user workflow with zero unauthorized background telemetry.")
    out.append("")
    out.append("---")
    out.append("")
    out.append("## 2. API Permissions Justification Statements")
    out.append("")

    if not perms:
        out.append("*No API permissions requested.*")
    else:
        for p in perms:
            just = STANDARD_JUSTIFICATIONS.get(p, f"Required to support the core functionality of {name} in accordance with user-initiated actions.")
            out.append(f"### Permission: `{p}`")
            out.append(f"- **Justification**: {just}")
            out.append("")

    out.append("---")
    out.append("")
    out.append("## 3. Host Permissions Justification Statements")
    out.append("")

    if not host_perms:
        out.append("*No host permissions requested.*")
    else:
        for hp in host_perms:
            out.append(f"### Host Pattern: `{hp}`")
            if hp == "<all_urls>" or hp == "*://*/*":
                out.append(f"- **Justification**: Required to allow {name} to execute its styling/utility features across all user-visited web pages upon explicit user toggle.")
            else:
                out.append(f"- **Justification**: Required to communicate with the official API backend (`{hp}`) for synchronization and feature delivery.")
            out.append("")

    out.append("---")
    out.append("")
    out.append("## 4. Privacy Practices Certification")
    out.append("- **User Data Collection**: Checked 'No' (or minimal, fully disclosed).")
    out.append("- **Remote Code Execution**: Certified that no remote scripts or external libraries are loaded at runtime.")
    out.append("- **Data Usage Certification**: Certified compliance with the Limited Use policy.")
    out.append("")
    return "\n".join(out)

def main():
    parser = argparse.ArgumentParser(description="Generate Chrome Web Store permission justifications.")
    parser.add_argument("--manifest", "-m", default="manifest.json", help="Path to manifest.json")
    parser.add_argument("--name", "-n", default="", help="Extension name override")
    parser.add_argument("--output", "-o", help="Output file path (default: stdout)")

    args = parser.parse_args()
    manifest_path = Path(args.manifest).resolve()

    if not manifest_path.is_file():
        # Search public/manifest.json
        alt = manifest_path.parent / "public" / "manifest.json"
        if alt.is_file():
            manifest_path = alt
        else:
            print(f"Error: manifest.json not found at {manifest_path}", file=sys.stderr)
            sys.exit(1)

    result = generate_justifications(manifest_path, args.name)
    if args.output:
        Path(args.output).write_text(result, encoding="utf-8")
        print(f"Justifications written to: {args.output}")
    else:
        print(result)

if __name__ == "__main__":
    main()
