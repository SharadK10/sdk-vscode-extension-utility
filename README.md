# SDK Generator Chatbot for VS Code


**Stop reading documentation. Start building.**


A VS Code extension that generates SDK utility files and provides context-aware integration instructions by analyzing your existing codebase.


## What It Does


1. **Generates SDK utility code** - Creates production-ready utility files for popular SDKs (SendGrid, Stripe, Twilio, AWS, etc.)
2. **Scans your workspace** - Analyzes your existing code structure
3. **Provides tailored instructions** - Tells you exactly where to add imports, what dependencies to install, and how to integrate with YOUR specific files


## Installation


```bash
npm install axios
```


Press **F5** in VS Code → Opens Extension Development Host → **Ctrl+Shift+P** → Type "Open Chatbot"


## Usage


Simply type natural language requests:
- "generate sendgrid util"
- "create stripe payment integration"
- "make twilio sms utility"


The bot will create the file in `workspace/utils/` and give you step-by-step integration instructions specific to your project.


## Advantages


✅ **Zero documentation reading** - AI generates code and instructions 
✅ **Context-aware** - Analyzes YOUR codebase for personalized guidance 
✅ **Production-ready** - Generates complete utility files, not snippets 
✅ **Time-saving** - 2 minutes vs 30+ minutes reading docs 
✅ **File-specific instructions** - "Add import to main.py line 5" not "add import somewhere" 
✅ **Multi-language support** - Python, JavaScript, TypeScript, Java, Go, Rust


## Use Cases


- **Quick SDK integration** without documentation deep-dives
- **Onboarding new APIs** to existing projects
- **Standardizing utilities** across team projects
- **Learning integrations** with real examples from your code


## Developer-Friendly Features


- Automatic dependency detection
- Environment variable setup guidance
- Exact file locations for code changes
- Working usage examples with your code structure
- No context switching to browser docs


**Build faster. Code smarter. Skip the docs.**

