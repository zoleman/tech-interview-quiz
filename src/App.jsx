import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function parseQuizMarkdown(markdownText) {
  const lines = markdownText.split('\n');
  const quizData = [];
  let currentTopic = null;
  let currentQuestion = null;
  let currentAnswer = [];
  let expectingQuestion = false;
  let inAnswer = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    if (trimmedLine.startsWith('## ') && !trimmedLine.startsWith('###')) {
      if (currentTopic && currentQuestion) {
        currentTopic.questions.push({
          question: currentQuestion,
          answer: currentAnswer.join('\n').trim() || 'No answer provided'
        });
        currentQuestion = null;
        currentAnswer = [];
        inAnswer = false;
        expectingQuestion = false;
      }
      if (currentTopic) {
        quizData.push(currentTopic);
      }
      currentTopic = {
        name: trimmedLine.replace('## ', ''),
        questions: []
      };
    }
    else if (trimmedLine === 'Question:' && currentTopic) {
      if (currentQuestion) {
        currentTopic.questions.push({
          question: currentQuestion,
          answer: currentAnswer.join('\n').trim() || 'No answer provided'
        });
        currentAnswer = [];
        inAnswer = false;
      }
      expectingQuestion = true;
    }
    else if (expectingQuestion && trimmedLine.startsWith('- ') && currentTopic) {
      currentQuestion = trimmedLine.replace(/^- \s*/, '').trim() || `Untitled Question ${index + 1}`;
      expectingQuestion = false;
    }
    else if (trimmedLine === 'Answer:' && currentTopic && currentQuestion) {
      inAnswer = true;
      currentAnswer = [];
    }
    else if (inAnswer && currentTopic && currentQuestion) {
      currentAnswer.push(line);
    }
    else if (trimmedLine.startsWith('- ') && currentTopic && !currentQuestion && !expectingQuestion) {
      if (currentQuestion) {
        currentTopic.questions.push({
          question: currentQuestion,
          answer: currentAnswer.join('\n').trim() || 'No answer provided'
        });
        currentAnswer = [];
        inAnswer = false;
      }
      currentQuestion = trimmedLine.replace(/^- \s*/, '').trim() || `Untitled Question ${index + 1}`;
    }
  });

  if (currentTopic && currentQuestion) {
    currentTopic.questions.push({
      question: currentQuestion,
      answer: currentAnswer.join('\n').trim() || 'No answer provided'
    });
  }
  if (currentTopic) {
    quizData.push(currentTopic);
  }

  return quizData;
}

// Mock validation function
function mockValidateAnswer(userAnswer, correctAnswer, validator) {
  if (!userAnswer || userAnswer.trim() === '') return false;

  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const userWords = new Set(normalize(userAnswer).split(/\s+/));
  const correctWords = new Set(normalize(correctAnswer).split(/\s+/));

  let matches = 0;
  userWords.forEach((word) => {
    if (correctWords.has(word)) matches++;
  });

  const threshold = validator === 'Grok' ? 0.5 : 0.4;
  const matchRatio = matches / Math.max(correctWords.size, 1);
  return matchRatio >= threshold;
}

function App() {
  const [quizData, setQuizData] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showAnswers, setShowAnswers] = useState({});
  const [userAnswers, setUserAnswers] = useState({});
  const [validationResults, setValidationResults] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [randomQuestion, setRandomQuestion] = useState(null);
  const [isMobileView, setIsMobileView] = useState(() => {
    // Load from localStorage or default to false (desktop)
    return localStorage.getItem('isMobileView') === 'true';
  });

  useEffect(() => {
    axios.get('./questions.md').then((response) => {
      const parsedData = parseQuizMarkdown(response.data);
      setQuizData(parsedData);
    }).catch((error) => {
      console.error('Error fetching questions:', error);
      alert('Failed to load questions. Check if questions.md is in the public folder.');
    });
  }, []);

  useEffect(() => {
    // Save view preference to localStorage
    localStorage.setItem('isMobileView', isMobileView);
  }, [isMobileView]);

  const toggleView = () => {
    setIsMobileView((prev) => !prev);
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setShowAnswers({});
    setSearchTerm('');
    setRandomQuestion(null);
  };

  const toggleAnswer = (index) => {
    setShowAnswers((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleUserAnswer = (index, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [index]: value
    }));
    setValidationResults((prev) => ({
      ...prev,
      [index]: undefined
    }));
  };

  const validateAnswer = (index, userAnswer, correctAnswer, validator) => {
    const isValid = mockValidateAnswer(userAnswer, correctAnswer, validator);
    setValidationResults((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [validator]: isValid
      }
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setSelectedTopic(null);
    setRandomQuestion(null);
  };

  const getFilteredQuestions = () => {
    if (!searchTerm) return [];
    const filtered = [];
    quizData.forEach((topic) => {
      topic.questions.forEach((q, index) => {
        if (q.question.toLowerCase().includes(searchTerm.toLowerCase())) {
          filtered.push({ topic: topic.name, question: q, index });
        }
      });
    });
    return filtered;
  };

  const getRandomQuestion = () => {
    const allQuestions = quizData.flatMap((topic) =>
      topic.questions.map((q, index) => ({ topic: topic.name, question: q, index }))
    );
    if (allQuestions.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    setRandomQuestion(allQuestions[randomIndex]);
    setSelectedTopic(null);
    setSearchTerm('');
    setShowAnswers({});
  };

  const renderAnswer = (answer) => {
    const tableRows = [];
    const otherContent = [];

    const lines = answer.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('|')) {
        const cells = trimmedLine.split('|').filter(cell => cell.trim());
        return { type: 'table', cells, key: i };
      }
      return { type: 'paragraph', content: line, key: i };
    }).filter(Boolean);

    lines.forEach((item) => {
      if (item.type === 'table') {
        tableRows.push(
          <tr key={item.key}>
            {item.cells.map((cell, ci) => (
              <td key={ci} className="table-cell">
                {cell.trim()}
              </td>
            ))}
          </tr>
        );
      } else {
        otherContent.push(
          <p key={item.key} className="answer-paragraph">
            {item.content}
          </p>
        );
      }
    });

    return (
      <div>
        {tableRows.length > 0 && (
          <table className="answer-table">
            <tbody>{tableRows}</tbody>
          </table>
        )}
        {otherContent}
      </div>
    );
  };

  const renderQuestion = (q, index, topicName) => (
    <div key={index} className="question">
      <h3>{q.question}</h3>
      <textarea
        className="user-answer"
        placeholder="Type your answer here..."
        value={userAnswers[index] || ''}
        onChange={(e) => handleUserAnswer(index, e.target.value)}
      />
      <div className="validation-buttons">
        <button
          className="validate-btn validate-grok"
          onClick={() => validateAnswer(index, userAnswers[index] || '', q.answer, 'Grok')}
          disabled={!userAnswers[index] || userAnswers[index].trim() === ''}
        >
          Validate with Grok
        </button>
        <button
          className="validate-btn validate-chatgpt"
          onClick={() => validateAnswer(index, userAnswers[index] || '', q.answer, 'ChatGPT')}
          disabled={!userAnswers[index] || userAnswers[index].trim() === ''}
        >
          Validate with ChatGPT
        </button>
      </div>
      <div className="validation-results">
        {validationResults[index]?.Grok !== undefined && (
          <p className={validationResults[index].Grok ? 'valid' : 'invalid'}>
            Grok: {validationResults[index].Grok ? 'True (Acceptable)' : 'False (Not Acceptable)'}
          </p>
        )}
        {validationResults[index]?.ChatGPT !== undefined && (
          <p className={validationResults[index].ChatGPT ? 'valid' : 'invalid'}>
            ChatGPT: {validationResults[index].ChatGPT ? 'True (Acceptable)' : 'False (Not Acceptable)'}
          </p>
        )}
      </div>
      <button
        className="show-answer-btn"
        onClick={() => toggleAnswer(index)}
      >
        {showAnswers[index] ? 'Hide Answer' : 'Show Answer'}
      </button>
      {showAnswers[index] && (
        <div className="answer">
          {renderAnswer(q.answer)}
        </div>
      )}
    </div>
  );

  return (
    <div className={`app ${isMobileView ? 'mobile-view' : 'desktop-view'}`}>
      <div className="view-toggle">
        <button onClick={toggleView}>
          Switch to {isMobileView ? 'Desktop' : 'Mobile'} View
        </button>
      </div>
      <h1>Tech Interview Quiz</h1>
      <div className="controls">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <button onClick={getRandomQuestion}>Random Question</button>
      </div>
      {randomQuestion ? (
        <div className="quiz">
          <h2>{randomQuestion.topic}</h2>
          {renderQuestion(randomQuestion.question, randomQuestion.index, randomQuestion.topic)}
          <button className="back-btn" onClick={() => setRandomQuestion(null)}>
            Back to Topics
          </button>
        </div>
      ) : searchTerm ? (
        <div className="quiz">
          <h2>Search Results</h2>
          {getFilteredQuestions().length > 0 ? (
            getFilteredQuestions().map((item, i) => (
              <div key={i} className="question">
                <h3>{item.question.question} <small>({item.topic})</small></h3>
                <textarea
                  className="user-answer"
                  placeholder="Type your answer here..."
                  value={userAnswers[item.index] || ''}
                  onChange={(e) => handleUserAnswer(item.index, e.target.value)}
                />
                <div className="validation-buttons">
                  <button
                    className="validate-btn validate-grok"
                    onClick={() => validateAnswer(item.index, userAnswers[item.index] || '', item.question.answer, 'Grok')}
                    disabled={!userAnswers[item.index] || userAnswers[item.index].trim() === ''}
                  >
                    Validate with Grok
                  </button>
                  <button
                    className="validate-btn validate-chatgpt"
                    onClick={() => validateAnswer(item.index, userAnswers[item.index] || '', item.question.answer, 'ChatGPT')}
                    disabled={!userAnswers[item.index] || userAnswers[item.index].trim() === ''}
                  >
                    Validate with ChatGPT
                  </button>
                </div>
                <div className="validation-results">
                  {validationResults[item.index]?.Grok !== undefined && (
                    <p className={validationResults[item.index].Grok ? 'valid' : 'invalid'}>
                      Grok: {validationResults[index].Grok ? 'True (Acceptable)' : 'False (Not Acceptable)'}
                    </p>
                  )}
                  {validationResults[item.index]?.ChatGPT !== undefined && (
                    <p className={validationResults[item.index].ChatGPT ? 'valid' : 'invalid'}>
                      ChatGPT: {validationResults[index].ChatGPT ? 'True (Acceptable)' : 'False (Not Acceptable)'}
                    </p>
                  )}
                </div>
                <button
                  className="show-answer-btn"
                  onClick={() => toggleAnswer(item.index)}
                >
                  {showAnswers[item.index] ? 'Hide Answer' : 'Show Answer'}
                </button>
                {showAnswers[item.index] && (
                  <div className="answer">
                    {renderAnswer(item.question.answer)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No questions found.</p>
          )}
        </div>
      ) : !selectedTopic ? (
        <div className="quiz">
          <h2>Select a Topic</h2>
          <ul>
            {quizData.map((topic, index) => (
              <li key={index}>
                <button onClick={() => handleTopicSelect(topic)}>
                  {topic.name} ({topic.questions.length} questions)
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="quiz">
          <button className="back-btn" onClick={() => setSelectedTopic(null)}>
            Back to Topics
          </button>
          <h2>{selectedTopic.name}</h2>
          {selectedTopic.questions.length > 0 ? (
            selectedTopic.questions.map((q, index) => renderQuestion(q, index, selectedTopic.name))
          ) : (
            <p>No questions found for this topic.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;