---
description: Install agent-system-mapper prompts to current directory
---

# /map-install — Install Agent System Mapper

Execute these two commands in sequence:

1. Download the install script (use -f to fail on errors):
   curl -fSL "https://raw.githubusercontent.com/peak-flow/agent-system-mapper/master/install.sh" -o /tmp/pf-mapper-install.sh

2. Run the downloaded script:
   bash /tmp/pf-mapper-install.sh

After running, list the `.pf-agent-system-mapper/` directory to verify installation.

If curl fails with a network error, tell the user there may be sandbox restrictions and suggest they run the command manually in their terminal outside of Claude Code.
