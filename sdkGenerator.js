const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

/**
 * Main function to create SDK utility file
 * @param {string} userMessage - User's message containing SDK name/request
 * @returns {Promise<string>} Success message with file path
 */
async function createSdkUtilFile(userMessage) {
    try {
        // Extract SDK name from user message
        const sdkName = extractSdkName(userMessage);
        
        // Make API call to get SDK code
        const responseText = await callAiApi(userMessage);
        
        // Parse the response
        const responseData = JSON.parse(responseText);
        
        // Extract content from response
        const content = responseData.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('No content found in AI response');
        }
        
        // Extract code from markdown
        const code = extractCodeFromMarkdown(content, 'python');
        
        // Generate filename
        const filename = generateFilename(sdkName, 'python');
        
        // Get workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open. Please open a folder first.');
        }
        
        // Create file with code
        const filePath = await createFileWithCode(
            workspaceFolder.uri.fsPath,
            'utils',
            filename,
            code
        );
        
        // Open the created file
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
        
        // Scan workspace and get integration instructions
        const workspaceFiles = await scanWorkspace(workspaceFolder.uri.fsPath);
        
        console.log(`Scanned ${workspaceFiles.length} files from workspace`);
        
        const integrationInstructions = await getIntegrationInstructions(
            sdkName,
            filename,
            code,
            workspaceFiles
        );
        
        const filesSummary = `\n\n📊 Analyzed ${workspaceFiles.length} files from your workspace for context.`;
        
        return `✅ Successfully created: ${filePath}\n\n${integrationInstructions}${filesSummary}`;
        
    } catch (error) {
        throw new Error(`Failed to create SDK file: ${error.message}`);
    }
}

/**
 * Extract SDK name from user message
 * @param {string} message - User's message
 * @returns {string} SDK name
 */
function extractSdkName(message) {
    // Common patterns: "generate sendgrid util", "create stripe sdk", etc.
    const lowerMsg = message.toLowerCase();
    
    // List of common SDK names
    const sdkNames = ['sendgrid', 'stripe', 'twilio', 'aws', 'mailgun', 'firebase'];
    
    for (const sdk of sdkNames) {
        if (lowerMsg.includes(sdk)) {
            return sdk;
        }
    }
    
    // Try to extract from "generate X" or "create X" patterns
    const match = lowerMsg.match(/(?:generate|create)\s+(\w+)/);
    if (match) {
        return match[1];
    }
    
    // Default fallback
    return 'sdk';
}

/**
 * Call AI API to generate SDK code
 * @param {string} userMessage - User's request
 * @returns {Promise<string>} API response text
 */
async function callAiApi(userMessage) {
    const url = "https://kkp6ox3gs32hikxnfob7n6mc.agents.do-ai.run/api/v1/chat/completions";
    
    const payload = {
        messages: [
            {
                role: "user",
                content: `${userMessage}. Generate a Python utility file. Don't include main function.`
            }
        ],
        stream: false,
        include_functions_info: false,
        include_retrieval_info: false,
        include_guardrails_info: false
    };
    console.log(payload);
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer API_KEY'
    };
    
    try {
        const response = await axios.post(url, payload, { headers });
        return JSON.stringify(response.data);
    } catch (error) {
        throw new Error(`API call failed: ${error.message}`);
    }
}

/**
 * Extract code from markdown code blocks
 * @param {string} content - Content with potential markdown blocks
 * @param {string} language - Programming language
 * @returns {string} Extracted code
 */
function extractCodeFromMarkdown(content, language) {
    // Pattern for language-specific code blocks: ```python ... ```
    let pattern = new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\`\`\``, 'g');
    let matches = [...content.matchAll(pattern)];
    
    if (matches.length > 0) {
        return matches[0][1].trim();
    }
    
    // Try generic code blocks without language
    pattern = /```\n([\s\S]*?)```/g;
    matches = [...content.matchAll(pattern)];
    
    if (matches.length > 0) {
        return matches[0][1].trim();
    }
    
    // Return content as-is if no code blocks found
    return content.trim();
}

/**
 * Generate standardized filename
 * @param {string} sdkName - SDK name
 * @param {string} language - Programming language
 * @returns {string} Generated filename
 */
function generateFilename(sdkName, language) {
    // Normalize SDK name
    const normalized = sdkName.toLowerCase()
        .replace(/-/g, '_')
        .replace(/\s+/g, '_');
    
    // Extension mapping
    const extensions = {
        'python': '.py',
        'javascript': '.js',
        'typescript': '.ts',
        'java': '.java',
        'go': '.go',
        'rust': '.rs'
    };
    
    const ext = extensions[language.toLowerCase()] || '.txt';
    
    return `${normalized}_util${ext}`;
}

/**
 * Create file with code in workspace
 * @param {string} workspacePath - Workspace root path
 * @param {string} baseDir - Base directory (e.g., 'utils')
 * @param {string} filename - Filename to create
 * @param {string} code - Code content
 * @returns {Promise<string>} Full file path
 */
async function createFileWithCode(workspacePath, baseDir, filename, code) {
    try {
        // Create full directory path
        const dirPath = path.join(workspacePath, baseDir);
        
        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });
        
        // Full file path
        const filePath = path.join(dirPath, filename);
        
        // Write code to file
        await fs.writeFile(filePath, code, 'utf-8');
        
        return filePath;
        
    } catch (error) {
        throw new Error(`File creation failed: ${error.message}`);
    }
}

/**
 * Scan workspace and read all relevant files
 * @param {string} workspacePath - Workspace root path
 * @returns {Promise<Array>} Array of file objects with path and content
 */
async function scanWorkspace(workspacePath) {
    const files = [];
    const excludeDirs = ['node_modules', '.git', 'venv', '__pycache__', '.vscode', 'dist', 'build'];
    const includeExtensions = ['.py', '.js', '.ts', '.java', '.go', '.rs', '.txt', '.md', '.json', '.yaml', '.yml'];
    const maxFileSize = 100000; // 100KB limit per file
    const maxFiles = 50; // Limit number of files to read
    
    async function readDir(dirPath) {
        if (files.length >= maxFiles) return;
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (files.length >= maxFiles) break;
                
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(workspacePath, fullPath);
                
                if (entry.isDirectory()) {
                    // Skip excluded directories
                    if (!excludeDirs.includes(entry.name)) {
                        await readDir(fullPath);
                    }
                } else if (entry.isFile()) {
                    // Check if file extension is included
                    const ext = path.extname(entry.name);
                    if (includeExtensions.includes(ext)) {
                        try {
                            const stats = await fs.stat(fullPath);
                            // Skip large files
                            if (stats.size <= maxFileSize) {
                                const content = await fs.readFile(fullPath, 'utf-8');
                                files.push({
                                    path: relativePath,
                                    name: entry.name,
                                    content: content
                                });
                            }
                        } catch (err) {
                            // Skip files that can't be read
                            console.error(`Error reading ${fullPath}:`, err.message);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Error reading directory ${dirPath}:`, err.message);
        }
    }
    
    await readDir(workspacePath);
    return files;
}

/**
 * Get detailed integration instructions from AI
 * @param {string} sdkName - SDK name
 * @param {string} filename - Created utility filename
 * @param {string} utilCode - Generated utility code
 * @param {Array} workspaceFiles - Scanned workspace files
 * @returns {Promise<string>} Detailed integration instructions
 */
async function getIntegrationInstructions(sdkName, filename, utilCode, workspaceFiles) {
    console.log("Generating instructions for integration");
    const url = "https://kkp6ox3gs32hikxnfob7n6mc.agents.do-ai.run/api/v1/chat/completions";
    
    // Prepare workspace context with size limit
    const MAX_CONTEXT_LENGTH = 50000; // Limit total context to avoid API limits
    let workspaceContext = '';
    let includedFiles = 0;
    
    for (const file of workspaceFiles) {
        const fileContext = `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
        if ((workspaceContext.length + fileContext.length) < MAX_CONTEXT_LENGTH) {
            workspaceContext += fileContext;
            includedFiles++;
        } else {
            break;
        }
    }
    
    const contextSummary = includedFiles < workspaceFiles.length 
        ? `(Showing ${includedFiles} of ${workspaceFiles.length} files due to size limits)`
        : `(All ${workspaceFiles.length} files included)`;
    
    const prompt = `I just generated a utility file "${filename}" for ${sdkName} SDK integration.

Here's the generated utility code:
\`\`\`python
${utilCode}
\`\`\`

Here are the files in my workspace ${contextSummary}:
${workspaceContext}

Please provide DETAILED step-by-step instructions to use the utility code generated based on the files in my workspace. Keep each and everything simple and easy to follow according to this workspace context

Format your response with clear headers, file names, and code blocks. Be specific about where to make changes in MY existing files.`;
    
    const payload = {
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        stream: false,
        include_functions_info: false,
        include_retrieval_info: false,
        include_guardrails_info: false
    };
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${API_KEY}'
    };
    
    try {
        console.log(`Sending ${includedFiles} files to AI for integration analysis...`);
        console.log("calling endpoint");
        const response = await axios.post(url, payload, { headers, timeout: 3000000 }); // 60 second timeout
        console.log("response received from agent");
        const content = response.data.choices?.[0]?.message?.content;
        console.log(content);
        if (!content) {
            console.log("Error in content");
            return `📄 File created successfully!\n\nIntegration instructions not available. Please refer to the ${sdkName} documentation.`;
        }
        console.log("Printing content");
        return `📚 HOW TO INTEGRATE:\n\n${content}`;
        
    } catch (error) {
        console.error('Error getting integration instructions:', error.message);
        
        if (error.code === 'ECONNABORTED') {
            return `📄 File created successfully!\n\n⏱️ Integration instruction request timed out. Your workspace might be too large.\n\nPlease refer to the ${sdkName} documentation or try with a smaller workspace.`;
        }
        
        return `📄 File created successfully!\n\n⚠️ Couldn't fetch integration instructions: ${error.message}\n\nPlease refer to the ${sdkName} documentation.`;
    }
}

module.exports = {
    createSdkUtilFile,
    extractCodeFromMarkdown,
    generateFilename,
    createFileWithCode,
    scanWorkspace,
    getIntegrationInstructions
};
