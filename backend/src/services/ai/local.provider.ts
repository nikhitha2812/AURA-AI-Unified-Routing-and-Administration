import {
  AIProviderInterface,
  AIProviderRequest,
  AIProviderResponse,
  AIProviderResponseChunk,
} from './ai.interface';

export class LocalShieldProvider implements AIProviderInterface {
  name = 'Local Shield';
  type = 'LOCAL';

  async generateResponse(request: AIProviderRequest): Promise<AIProviderResponse> {
    const startTime = Date.now();
    const lastUserMsg = request.messages[request.messages.length - 1]?.content || '';
    const content = this.synthesizeResponse(lastUserMsg);
    const latencyMs = Date.now() - startTime;

    const inputTokens = Math.ceil(lastUserMsg.length / 4);
    const outputTokens = Math.ceil(content.length / 4);

    return {
      content,
      modelId: request.modelId,
      inputTokens,
      outputTokens,
      latencyMs,
    };
  }

  async generateStream(
    request: AIProviderRequest,
    onChunk: (chunk: AIProviderResponseChunk) => void
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    const lastUserMsg = request.messages[request.messages.length - 1]?.content || '';
    const fullText = this.synthesizeResponse(lastUserMsg);

    // Stream word by word with micro-delays
    const words = fullText.split(' ');
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i === words.length - 1 ? '' : ' ');
      accumulated += word;
      const isComplete = i === words.length - 1;

      onChunk({
        contentDelta: word,
        isComplete,
        modelId: request.modelId,
      });

      // Small async delay for realistic streaming
      await new Promise((r) => setTimeout(r, 15));
    }

    const latencyMs = Date.now() - startTime;
    const inputTokens = Math.ceil(lastUserMsg.length / 4);
    const outputTokens = Math.ceil(fullText.length / 4);

    return {
      content: fullText,
      modelId: request.modelId,
      inputTokens,
      outputTokens,
      latencyMs,
    };
  }

  private synthesizeResponse(prompt: string): string {
    const lower = prompt.toLowerCase().trim();

    // 1. Prompt / Prompting / Meaning of prompt
    if (lower.includes('prompt')) {
      return `### What is a Prompt in Artificial Intelligence & LLMs?

A **prompt** is the input text, question, instruction, or contextual query provided to an Artificial Intelligence (AI) model or Large Language Model (LLM) to direct and guide its output generation.

---

### 🔑 Core Elements of a Well-Structured Prompt:
1. **Instruction / Directive**: The explicit task you want the AI to execute (e.g., *"Explain"*, *"Summarize"*, *"Write a function in TypeScript"*).
2. **Context**: Background role, domain boundaries, or security constraints (e.g., *"Functioning as an enterprise security system"*).
3. **Input Payload**: The specific data, code block, or document to process.
4. **Output Format**: Desired formatting rules (e.g., *"Return a Markdown table"*, *"Respond strictly in valid JSON"*).

---

### 💡 Example Prompt Format:

\`\`\`text
[System Directive]: You are an enterprise AI Governance Assistant.
[Task Instruction]: Explain the difference between synchronous REST API calls and Server-Sent Events (SSE).
[Formatting constraint]: Provide key comparisons in a markdown table.
\`\`\`

---

### 🛡️ How Prompts are Processed in AURA:
When you submit a prompt through the **AURA AI Gateway**:
- **DLP Pre-flight Scan**: Automatically detects & masks sensitive data (PII, emails, credit cards, API keys).
- **Per-Message Task Classification**: Categorizes the prompt (e.g., coding, complex reasoning, private data, fast response).
- **Intelligent Routing**: Selects the optimal model (Gemini, OpenAI, Llama 3, or Local Shield) based on governance rules and performance metrics.`;
    }

    // 2. Flask / Flask API
    if (lower.includes('flask')) {
      return `### Overview of Flask & Flask REST APIs\n\n**Flask** is a lightweight Python WSGI web framework designed for creating scalable web applications and microservice REST APIs with simplicity and flexibility.\n\n#### Key Features of Flask:\n- **Microframework**: Minimal core with zero enforced database dependencies or ORM boilerplate.\n- **Flexible Routing**: Explicit URL mapping using decorators (\`@app.route\`).\n- **JSON Native**: Built-in \`jsonify\` utility for rapid REST API endpoint response serialization.\n\n\`\`\`python\nfrom flask import Flask, jsonify, request\n\napp = Flask(__name__)\n\n@app.route('/api/v1/health', methods=['GET'])\ndef health_check():\n    return jsonify({\n        "status": "healthy",\n        "service": "AURA AI Gateway Backend",\n        "engine": "Flask REST API"\n    }), 200\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=5000, debug=True)\n\`\`\`\n\n#### Popular Flask Extensions:\n- **Flask-RESTful / Flask-Smorest**: Structured REST API resource classes and Swagger/OpenAPI docs.\n- **Flask-SQLAlchemy**: Object-Relational Mapping (ORM) for PostgreSQL, MySQL, and SQLite.\n- **Flask-JWT-Extended**: Authentication & JWT token security enforcement.`;
    }

    // 3. FastAPI
    if (lower.includes('fastapi')) {
      return `### Overview of FastAPI\n\n**FastAPI** is a high-performance Python web framework for building APIs with Python 3.8+ based on standard Python type hints, Pydantic validation, and OpenAPI specs.\n\n\`\`\`python\nfrom fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI(title="AURA Gateway API")\n\nclass QueryRequest(BaseModel):\n    prompt: str\n    max_tokens: int = 100\n\n@app.post("/api/v1/query")\nasync def process_query(req: QueryRequest):\n    return {"status": "success", "processed_prompt": req.prompt}\n\`\`\``;
    }

    // 4. Java
    if (lower.includes('java')) {
      return `### Overview of Java\n\n**Java** is a high-level, class-based, object-oriented programming language designed around the **"Write Once, Run Anywhere" (WORA)** paradigm via the Java Virtual Machine (JVM).\n\n#### Key Principles:\n1. **Object-Oriented**: Encapsulation, Inheritance, Polymorphism, Abstraction.\n2. **Platform Independence**: Compiles to Bytecode (\`.class\` files) executed by platform-specific JVMs.\n3. **Automatic Garbage Collection**: Memory safety and automated resource recycling.\n\n\`\`\`java\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello from AURA AI Gateway!");\n    }\n}\n\`\`\``;
    }

    // 5. Python
    if (lower.includes('python')) {
      return `### Overview of Python\n\n**Python** is an interpreted, high-level, general-purpose programming language renowned for readable syntax and dynamic typing.\n\n\`\`\`python\n# Enterprise Python Data Processing Example\ndef calculate_telemetry(token_counts: list[int]) -> dict:\n    total = sum(token_counts)\n    avg = total / len(token_counts) if token_counts else 0\n    return {"total_tokens": total, "average_tokens": avg}\n\nprint(calculate_telemetry([150, 320, 480]))\n\`\`\`\n\n#### Primary Use Cases:\n- Backend APIs (FastAPI, Flask, Django)\n- Artificial Intelligence & Data Science (PyTorch, TensorFlow, Pandas)\n- Automation & Security Operations`;
    }

    // 6. REST API (Exact word boundary check: \bapi\b or \brest\b)
    if (/\b(rest|restful)\b/.test(lower) || (/\bapi\b/.test(lower) && !lower.includes('flask') && !lower.includes('fastapi'))) {
      return `### What is a REST API?\n\n**REST (Representational State Transfer)** is an architectural style for designing networked applications and web services. RESTful APIs allow clients to interact with server resources using standard HTTP protocol methods.\n\n#### Core Principles of REST:\n- **Statelessness**: Every request contains all necessary context and credentials.\n- **Resource Endpoints**: URI paths represent resources (e.g. \`/api/users\`, \`/api/policies\`).\n- **Standard HTTP Methods**:\n  - \`GET\`: Retrieve resource data\n  - \`POST\`: Create a new resource\n  - \`PUT\` / \`PATCH\`: Update existing resources\n  - \`DELETE\`: Remove a resource\n- **JSON Payloads**: Exchanging structured JSON bodies.`;
    }

    // 7. Greetings
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return `Hello! I am **AURA Shield Neural v1**, operating as your organization's secure AI Gateway model. How can I assist you with your software development, architecture, security policies, or administrative tasks today?`;
    }

    // 8. Coding General
    if (lower.includes('code') || lower.includes('function') || lower.includes('typescript') || lower.includes('javascript') || lower.includes('react')) {
      return `Here is a clean TypeScript solution tailored to your prompt:\n\n\`\`\`typescript\n/**\n * AURA Enterprise Data Processor\n */\nexport function processGatewayRequest<T>(payload: T): { success: boolean; data: T; timestamp: string } {\n  console.log('Processing request through AURA Governance Pipeline...');\n  return {\n    success: true,\n    data: payload,\n    timestamp: new Date().toISOString(),\n  };\n}\n\`\`\`\n\nThis implementation adheres to modern TypeScript standards, strong typing, and zero-leakage security constraints.`;
    }

    // 9. Policy & Security
    if (lower.includes('policy') || lower.includes('privacy') || lower.includes('security') || lower.includes('dlp')) {
      return `### AURA Security & DLP Governance Status\n\n- **DLP Engine**: Active (Regex + Policy Rule Inspection)\n- **PII Filter**: Enabled (Emails, Phone numbers, Credit Cards, SSNs, API Keys)\n- **Data Classification**: Evaluated per request\n- **Model Isolation**: On-premise air-gapped processing supported\n- **Audit Compliance**: Logged to append-only security ledger`;
    }

    // 10. Router & Model Selection
    if (lower.includes('router') || lower.includes('routing') || lower.includes('model')) {
      return `### AURA Intelligent AI Model Router Architecture\n\nAURA's Model Router dynamically evaluates incoming prompts to select the optimal model (Gemini 1.5 Pro, GPT-4o, Llama 3, or Local Shield).\n\n#### Evaluation Criteria:\n1. **Task Type Classification**: Identifies coding, complex reasoning, sensitive data, or fast responses.\n2. **Security & DLP Action**: Forces local processing if prompt contains masked confidential attributes.\n3. **User Role Permissions**: Enforces role hierarchy constraints (e.g. Employee vs Admin).\n4. **Provider Health & Priority**: Automatically fails over to Local Shield Engine if cloud provider APIs are unreachable.`;
    }

    // Dynamic Intelligent General Query Fallback
    const cleanTopic = prompt.replace(/[^\w\s]/gi, '').trim();
    const topicTitle = cleanTopic.length > 0 ? cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1) : 'Requested Topic';

    return `### Concept Breakdown: ${topicTitle}\n\nHere is an analytical explanation for **"${prompt}"**:\n\n#### 1. Fundamental Concept\n**${topicTitle}** represents a core subject within software architecture, AI prompt engineering, or modern system governance. When interacting with an enterprise AI Gateway, clear directives ensure high-precision responses.\n\n#### 2. Key Takeaways & Architectural Principles\n- **Clarity & Context**: Formulate questions with background context for optimal output.\n- **Security Validation**: All inputs undergo real-time DLP verification prior to processing.\n- **Enterprise Standards**: Enforces type safety, role-based access, and latency telemetry.\n\n#### 3. Practical Example Pattern\n\`\`\`typescript\n// Example Contextual Processor for: ${cleanTopic}\nexport function processQueryContext(topic: string) {\n  return {\n    topic,\n    processedAt: new Date().toISOString(),\n    status: 'COMPLETED'\n  };\n}\n\`\`\`\n\nFeel free to ask for deeper technical breakdowns, code implementations, or policy rules related to **"${prompt}"**!`;
  }
}
