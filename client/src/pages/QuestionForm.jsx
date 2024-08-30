import React from 'react'
import Description from '../components/Description/Description'
import QuestionPage from '../components/Questionpage/QuestionPage'
import questionimg from '../assets/question.png'

// const question1 = "What type of movie do you love watching on repeat?";
//   const options1 = [
//     'Romantic Movies',
//     'Adventure/Travel Movies',
//     'Comedies',
//     'Action/Thriller Movies'
//   ];

//   const question2 = "How do you spend your ideal weekend?";
//   const options2 = [
//     'Hanging out with friends',
//     'Exploring new places',
//     'Binge-watching TV shows',
//     'Reading a good book'
//   ];
const QuestionForm = () => {
  return (
    <div 
      className='flex justify-around align-middle p-4 bg-cover bg-center'
      style={{ backgroundImage: `url(${questionimg})` }}
    >
      <Description text="Discover Your Vibe Tell Us About Your Interests"/>
      <QuestionPage  />
     
    </div>
  )
}

export default QuestionForm
