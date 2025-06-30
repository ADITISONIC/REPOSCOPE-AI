# 🔍 RepoScope AI

RepoScope AI is your intelligent codebase companion — helping developers understand, test, and onboard faster in any repository using AI.

---

## 🚀 Features

- 🧠 **AI-Powered Repository Analysis**  
  Understand unfamiliar codebases instantly with AI-generated summaries, tutorials, and architecture overviews.

- 🧪 **Live Test Playground**  
  Generate & run PyTest / Jest tests right inside your browser via WebContainers – see ✅ Passed / ❌ Failed in real time.

- 🧰 **Dev Environment Detector**  
  Automatically identifies required tools, dependencies, and environment variables. Get a ✅ checklist before setup.

- 🏗️ **Architecture Maps & File Insights**  
  Visual breakdown of folders, files, and component interrelationships using embeddings and static analysis.

- 🤖 **AutoDoc & Tutorial Generator**  
  Generate usage guides, code walkthroughs, and custom onboarding docs for any part of the repo.

---

## ⚙️ Tech Stack

- 🧱 **Frontend**: React + TypeScript + Tailwind CSS  
- 💡 **AI Layer**: OpenAI GPT, LangChain  
- ⚗️ **Runtime**: StackBlitz WebContainers, Pyodide  
- 📁 **Repo Parsing**: Tree-sitter, AST, Embeddings  
- 🛠️ **Backend**: Node.js, Express, Supabase (optional)

---

## 📦 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/reposcope-ai.git
   cd reposcope-ai
2.	Install dependencies
   npm install
3.	Add your environment variables
   Create a .env file with:
  	OPENAI_API_KEY=your-key-here
    DB_URL=your-database-url
    JWT_SECRET=your-secret
4. Run the app
   npm run dev
