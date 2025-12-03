# tech-interview-quiz

## Description
`tech-interview-quiz` is a React-based interactive quiz application designed to help practice questions for the web module. It loads questions from a Markdown file (`questions.md`), parses them into topics and questions, and provides an interface where you can search, answer, self-validate, and reveal answers. It’s both a study tool and a practical project for improving your front-end development skills.

## Scope
- Reinforces coding skills by building a real React application with state, effects, parsing logic, and user interaction.
- Helps study for technical interviews by giving a structured quiz system that can be expanded over time.
- Provides hands-on experience with modern tooling (React 19, Vite, axios, GitHub Pages deployment).
- Practice UI logic, state management, validation mechanisms, responsive layouts, and file parsing.
- Acts as a reusable, extensible personal “interview prep” platform.

## Prerequisites
- **Node.js** (LTS recommended, v18+ works great)
- **npm** (comes with Node)
- A modern browser
- A shell/terminal for running npm commands

## Dependencies

### Runtime Dependencies
These are required for the application to run:

- **react** – UI framework
- **react-dom** – DOM renderer for React
- **axios** – HTTP client used to load `questions.md`

### Development Dependencies
Used during development, build, and deployment:

- **vite** – Build tool and dev server
- **@vitejs/plugin-react** – React plugin for Vite
- **eslint** and plugins – Linting and code quality
- **gh-pages** – Deployment to GitHub Pages
- **@types/react**, **@types/react-dom** – Type definitions for editors/TS tooling

### Tooling Configuration
- `vite.config.js` sets the GitHub Pages base path and tells Vite to include `.md` files in the build.

## Setup / Build / Run

### 1. Clone the repository
```bash
git clone https://github.com/zoleman/tech-interview-quiz.git
cd tech-interview-quiz
```
## 2. Install dependencies
```
npm install
```
## 3. Start the development server
```
npm run dev
# Then open the URL shown in your terminal (usually http://localhost:5173)
```
## 4. Build for production
```
npm run build
```
## 5. Deploy to GitHub Pages
```
# This builds and publishes the dist directory to your gh-pages branch.
npm run deploy
```
