# OllamaChat

A full-stack chat application powered by Ollama AI models.

## Project Structure

```
OllamaChat/
├── backend/          # FastAPI backend server
│   ├── main.py       # Main application entry point
│   ├── requirements.txt
│   └── ven/          # Python virtual environment
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── App.jsx   # Main React component
│   │   ├── main.jsx  # React entry point
│   │   └── index.css # Tailwind CSS styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md         # This file
```

## Features

- **Real-time chat** with AI models
- **Modern UI** built with React and Tailwind CSS
- **FastAPI backend** for efficient API handling
- **Responsive design** for mobile and desktop

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv ven
source ven/bin/activate  # On Windows: ven\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Development

The backend runs on `http://localhost:8000` and the frontend on `http://localhost:5173`.

## Technologies Used

- **Backend**: FastAPI, Python
- **Frontend**: React, Vite, Tailwind CSS
- **AI Integration**: Ollama

## License

MIT License
