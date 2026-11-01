🌍 SupplyZero

Intelligent Technology. Real-World Impact. Smarter Solutions.

<p align="center">
  <strong>A technology-driven solution built to transform real-world challenges through AI, real-time communication, and modern full-stack development.</strong>
</p><p align="center">
  🚀 HACKATHON PROJECT &nbsp; | &nbsp; 🤖 AI-POWERED &nbsp; | &nbsp; ⚡ REAL-TIME &nbsp; | &nbsp; 💻 FULL-STACK
</p>---

🌐 LIVE PROJECT — TRY SUPPLYZERO

<p align="center">
  <a href="https://backend-27w3u1x9z-shreshth-commits.vercel.app/">
    <strong>🚀 CLICK HERE TO EXPLORE SUPPLYZERO</strong>
  </a>
</p>Live Deployment:
https://backend-27w3u1x9z-shreshth-commits.vercel.app/

Experience the deployed SupplyZero application and explore its interface and available functionality.

GitHub Repository:
https://github.com/SupplyZero/backend

---

💡 About the Project

SupplyZero is a technology-driven project developed with the vision of creating an intelligent, connected, and scalable software solution.

By combining modern frontend technologies, powerful backend architecture, real-time communication, and AI integration, SupplyZero aims to deliver a unified and efficient application experience.

Our focus is on building a solution that goes beyond conventional approaches by emphasizing innovation, accessibility, performance, and future scalability.

«Our Vision: Transform ideas into impactful technology and build smarter solutions for real-world challenges.»

---

🎯 Problem Statement

Modern digital solutions often face challenges involving disconnected workflows, inefficient information management, limited real-time communication, and a lack of intelligent assistance.

These limitations can affect productivity, accessibility, and decision-making.

SupplyZero aims to address these challenges through an integrated platform that combines modern software engineering with intelligent technologies.

---

✨ Key Features

- Modern Full-Stack Architecture: A React-powered frontend integrated with a FastAPI backend.
- AI-Powered Copilot: Gemini API integration for intelligent assistance.
- Real-Time Communication: WebSocket support for live data streaming.
- Interactive API Documentation: Swagger UI for exploring and testing APIs.
- Modular Backend Architecture: Organized application structure for maintainability.
- Scalable Development Approach: Designed to support future improvements and integrations.
- Live Web Deployment: Accessible through the deployed application.

---

🧠 Innovation & Uniqueness

SupplyZero focuses on bringing multiple modern technologies together into one integrated solution.

Innovation| Contribution
AI Integration| Enables intelligent assistance
Real-Time Communication| Supports live updates
Full-Stack Integration| Connects frontend and backend
Modular Architecture| Improves maintainability
API-Driven Design| Supports extensibility and integration

The combination of these technologies creates a foundation for a more connected and intelligent application.

---

🏗️ System Architecture

SupplyZero follows a client-server architecture in which the frontend communicates with backend services through APIs and WebSockets.

flowchart TD
    A[User] --> B[React + Vite Frontend]
    B --> C[FastAPI Backend]
    C --> D[Application Services]
    C --> E[WebSocket Communication]
    D --> F[Gemini AI Integration]
    E --> B
    F --> C

Architecture Overview

Component| Technology| Purpose
Frontend| React + Vite| User interface
Backend| Python + FastAPI| Business logic and APIs
Communication| WebSockets| Real-time updates
AI Integration| Google Gemini API| AI-powered copilot
API Documentation| Swagger / OpenAPI| API exploration

---

🛠️ Technology Stack

Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3

Backend

- Python 3.11
- FastAPI
- Uvicorn
- WebSockets

Artificial Intelligence

- Google Gemini API

Development Tools

- Git
- GitHub
- npm
- Swagger UI

---

📂 Project Structure

SupplyZero/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── ...
│   ├── .env.example
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── README.md

Note: This is a simplified representation of the project structure.

---

⚙️ Installation & Setup

Follow these steps to run SupplyZero locally.

Prerequisites

Make sure you have installed:

- Python 3.11
- Node.js and npm
- Git
- Google Gemini API key (for AI copilot functionality)

Step 1: Clone the Repository

git clone https://github.com/SupplyZero/backend.git
cd backend

Step 2: Set Up the Backend

cd backend

py -3.11 -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install -e ".[dev]"

Step 3: Configure Environment Variables

Copy-Item .env.example .env

Add your Gemini API key to the backend environment file:

GEMINI_API_KEY=your_api_key_here

Security Note: Never upload API keys, passwords, or secret credentials to GitHub.

Step 4: Initialize the Backend

python -m app.seed

Step 5: Start the Backend Server

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

Backend URL:

http://127.0.0.1:8000

API Documentation:

http://127.0.0.1:8000/docs

Step 6: Start the Frontend

Open another terminal:

cd frontend

npm install

npm run dev

Open the application:

http://localhost:5173

---

🔌 Real-Time Communication

SupplyZero incorporates WebSocket functionality to enable real-time communication between the frontend and backend.

WebSocket Endpoint:

ws://127.0.0.1:8000/ws/stream

This communication mechanism supports streaming updates and provides a foundation for responsive application experiences.

---

🤖 AI Integration

SupplyZero integrates Google's Gemini API to power its AI copilot functionality.

The integration introduces AI capabilities into the application and creates opportunities for intelligent assistance and enhanced user interaction.

The Gemini API key can be configured through the backend environment variables.

---

🔮 Future Scope

SupplyZero has the potential to evolve through several improvements:

- Advanced AI-powered functionalities.
- Enhanced real-time communication.
- Improved performance and scalability.
- Additional third-party integrations.
- Advanced security and authentication.
- Cloud infrastructure optimization.
- Improved user experience and accessibility.

Our long-term objective is to transform SupplyZero into a more comprehensive, reliable, and scalable solution.

---

🏆 Why SupplyZero?

We believe impactful innovation comes from identifying real-world challenges and approaching them with the right combination of technology and creativity.

SupplyZero reflects our commitment to:

- Problem-solving through technology.
- Intelligent application development.
- Collaborative engineering.
- Scalable software architecture.
- Continuous innovation.

We don't just build applications. We build solutions with purpose.

---

👥 Team SupplyZero

Built with collaboration, creativity, and a shared vision of innovation.

Team Member| Responsibility
Member 1| Backend Development
Member 2| Frontend Development
Member 3| AI Integration
Member 4| Application Development
Member 5| Testing & Integration
Member 6| Research & Documentation

Replace the placeholders with actual team members and their contributions.

---

📄 License

License details will be added according to the project's distribution and usage requirements.

---

<p align="center">
  <strong>🌍 SUPPLYZERO</strong>
  <br/>
  <em>Think Beyond Limits. Build With Purpose. Create Impact.</em>
  <br/><br/>
  🚀 <a href="https://backend-27w3u1x9z-shreshth-commits.vercel.app/">Explore the Live Project</a>
  <br/>
  💻 <a href="https://github.com/SupplyZero/backend">Explore the GitHub Repository</a>
</p>

## Deploy publicly on Render

The `render.yaml` Blueprint creates a public API service (`supplyzero-api`) and a public static dashboard (`supplyzero`). Connect this repository in Render and deploy the Blueprint. Visitors can open the dashboard without a Render login; the API is also public and has no user authentication.

The default configuration uses the demo SQLite database. On Render's free web service, the filesystem is ephemeral and the seeded demo data is recreated after restarts or idle spin-downs. The API can take about a minute to wake after 15 minutes without traffic. Do not use this free demo deployment for real shipment or product-quality decisions. Add `GEMINI_API_KEY` to the API service in Render only if enabling the optional Gemini-backed API copilot.
