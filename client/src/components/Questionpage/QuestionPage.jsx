import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const QuestionPage = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch questions when the component mounts
    const fetchQuestions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/questions');
        setQuestions(response.data);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to fetch questions.');
      }
    };

    fetchQuestions();
  }, []);

  const handleOptionChange = (questionId, option) => {
    setSelectedOptions((prevOptions) => ({
      ...prevOptions,
      [questionId]: option,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Replace token with actual token if authentication is needed
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:5000/api/auth/submit-answers',
        selectedOptions,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(response.data);
      navigate('/login');
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError('Failed to submit answers.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative">
      <div className="bg-white bg-opacity-20 backdrop-blur-md p-8 rounded-lg shadow-lg w-96 mx-auto relative">
        <h2 className="text-2xl font-semibold text-white mb-2">Answer Questions</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {questions.map((question) => (
            <div key={question._id} className="mb-4">
              <p className="text-white font-semibold">{question.text}</p>
              <div className="flex flex-col">
                {question.options.map((option) => (
                  <label key={option} className="text-white cursor-pointer">
                    <input
                      type="radio"
                      name={question._id}
                      value={option}
                      checked={selectedOptions[question._id] === option}
                      onChange={() => handleOptionChange(question._id, option)}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold"
          >
            Submit Answers
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionPage;
