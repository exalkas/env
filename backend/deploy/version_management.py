#!/usr/bin/env python3
"""
Version Management Script
Helps manage application versions during deployment
"""

import json
import os
import sys
from datetime import datetime

VERSION_FILE = "../VERSION"
CHANGELOG_FILE = "../CHANGELOG.md"

def get_current_version():
    """Get current version from VERSION file"""
    if os.path.exists(VERSION_FILE):
        with open(VERSION_FILE, 'r') as f:
            return f.read().strip()
    return "0.0.0"

def set_version(new_version):
    """Set new version in VERSION file"""
    with open(VERSION_FILE, 'w') as f:
        f.write(new_version)
    print(f"✅ Version updated to {new_version}")

def bump_version(bump_type="patch"):
    """Bump version number"""
    current = get_current_version()
    parts = current.split('.')
    
    if len(parts) != 3:
        print("❌ Invalid version format. Expected: major.minor.patch")
        return
    
    major, minor, patch = map(int, parts)
    
    if bump_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif bump_type == "minor":
        minor += 1
        patch = 0
    elif bump_type == "patch":
        patch += 1
    else:
        print("❌ Invalid bump type. Use: major, minor, or patch")
        return
    
    new_version = f"{major}.{minor}.{patch}"
    set_version(new_version)
    return new_version

def create_deployment_info():
    """Create deployment information file"""
    version = get_current_version()
    deploy_info = {
        "version": version,
        "deploy_date": datetime.now().isoformat(),
        "deployed_by": os.getenv('USER', 'unknown'),
        "git_commit": get_git_commit(),
        "environment": "production"
    }
    
    with open("../deploy_info.json", 'w') as f:
        json.dump(deploy_info, f, indent=2)
    
    print(f"✅ Deployment info created for version {version}")
    return deploy_info

def get_git_commit():
    """Get current git commit hash"""
    try:
        import subprocess
        result = subprocess.run(['git', 'rev-parse', 'HEAD'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()[:8]
    except:
        pass
    return "unknown"

def update_changelog(version, changes):
    """Update changelog with new version"""
    changelog_entry = f"""
## [{version}] - {datetime.now().strftime('%Y-%m-%d')}

### Changes
{changes}

"""
    
    if os.path.exists(CHANGELOG_FILE):
        with open(CHANGELOG_FILE, 'r') as f:
            existing = f.read()
        
        # Insert new entry after the header
        lines = existing.split('\n')
        header_end = next(i for i, line in enumerate(lines) if line.startswith('## ['))
        lines.insert(header_end, changelog_entry.strip())
        
        content = '\n'.join(lines)
    else:
        content = f"""# Changelog

All notable changes to this project will be documented in this file.

{changelog_entry.strip()}
"""
    
    with open(CHANGELOG_FILE, 'w') as f:
        f.write(content)
    
    print(f"✅ Changelog updated")

def show_help():
    """Show help information"""
    print("""
Version Management Commands:

  python version_management.py current                    # Show current version
  python version_management.py bump [major|minor|patch]   # Bump version (default: patch)
  python version_management.py set 1.2.3                 # Set specific version
  python version_management.py deploy-info               # Create deployment info
  python version_management.py changelog "changes"       # Update changelog

Examples:
  python version_management.py bump patch                # 1.0.0 -> 1.0.1
  python version_management.py bump minor                # 1.0.1 -> 1.1.0
  python version_management.py bump major                # 1.1.0 -> 2.0.0
  python version_management.py changelog "Fixed login bug"
""")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        show_help()
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "current":
        version = get_current_version()
        print(f"Current version: {version}")
    
    elif command == "bump":
        bump_type = sys.argv[2] if len(sys.argv) > 2 else "patch"
        new_version = bump_version(bump_type)
        if new_version:
            print(f"Version bumped from {get_current_version()} to {new_version}")
    
    elif command == "set":
        if len(sys.argv) < 3:
            print("❌ Please specify version: python version_management.py set 1.2.3")
            sys.exit(1)
        set_version(sys.argv[2])
    
    elif command == "deploy-info":
        create_deployment_info()
    
    elif command == "changelog":
        if len(sys.argv) < 3:
            print("❌ Please specify changes: python version_management.py changelog 'Description of changes'")
            sys.exit(1)
        
        version = get_current_version()
        changes = sys.argv[2]
        update_changelog(version, changes)
    
    else:
        print(f"❌ Unknown command: {command}")
        show_help()
        sys.exit(1) 