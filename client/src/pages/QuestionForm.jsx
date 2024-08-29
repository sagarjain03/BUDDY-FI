import React, { useState } from 'react';

const QuestionForm = () => {
  // State to store current step and answers
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    interest: '',
    favoriteSubject: '',
    hobbies: ''
  });

  // Handler for changing the answer
  const handleChange = (e) => {
    setAnswers({ ...answers, [e.target.name]: e.target.value });
  };

  // Move to the next question
  const handleNext = () => {
    setStep(step + 1);
  };

  // Render questions based on the current step
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Tell us about your interest</h2>

      {/* Step 1: Ask about interest */}
      {step === 1 && (
        <div>
          <p className="mb-4">What is your main area of interest?</p>
          <input
            type="text"
            name="interest"
            value={answers.interest}
            onChange={handleChange}
            className="border p-2 mb-4 w-full"
          />
          <button onClick={handleNext} className="bg-blue-500 text-white p-2 rounded-md">
            Next
          </button>
        </div>
      )}

      {/* Step 2: Ask about favorite subject */}
      {step === 2 && (
        <div>
          <p className="mb-4">What is your favorite subject?</p>
          <input
            type="text"
            name="favoriteSubject"
            value={answers.favoriteSubject}
            onChange={handleChange}
            className="border p-2 mb-4 w-full"
          />
          <button onClick={handleNext} className="bg-blue-500 text-white p-2 rounded-md">
            Next
          </button>
        </div>
      )}

      {/* Step 3: Ask about hobbies */}
      {step === 3 && (
        <div>
          <p className="mb-4">What are your hobbies?</p>
          <input
            type="text"
            name="hobbies"
            value={answers.hobbies}
            onChange={handleChange}
            className="border p-2 mb-4 w-full"
          />
          <button onClick={handleNext} className="bg-blue-500 text-white p-2 rounded-md">
            Finish
          </button>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <div>
          <h3 className="text-lg font-bold mb-4">Thanks for your answers!</h3>
          <p><strong>Interest:</strong> {answers.interest}</p>
          <p><strong>Favorite Subject:</strong> {answers.favoriteSubject}</p>
          <p><strong>Hobbies:</strong> {answers.hobbies}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionForm;
