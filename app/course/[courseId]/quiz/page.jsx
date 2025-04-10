"use client"
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import StepProgress from '../_components/StepProgress';
import QuizCardItem from './_components/QuizCardItem';
import EndScreen from '../_components/EndScreen';

function Quiz() {
    const {courseId}=useParams();
    const router = useRouter();
    const [quizData,setQuizData]=useState();
    const [stepCount,setStepCount]=useState(0);
    const [isCorrectAns,setIsCorrectAnswer]=useState(null);
    const [quiz,setQuiz]=useState([]);
    const [correctAns,setCorrectAns]=useState();
    const [userAnswers, setUserAnswers] = useState({});
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    useEffect(()=>{
        GetQuiz()
    },[courseId])

    const GetQuiz=async()=>{
        console.log(courseId)
        const result=await axios.post('/api/study-type',{
            courseId:courseId,
            studyType:'Quiz'
        });

        console.log("Study type Quiz data:", result.data);
        
        // Check if we have quiz questions in the content
        if (result.data?.content?.quiz) {
            setQuiz(result.data.content.quiz);
        } else if (Array.isArray(result.data?.content?.questions)) {
            setQuiz(result.data.content.questions);
        } else {
            console.error("Unexpected quiz data format:", result.data);
            setQuiz([]);
        }
        
        setQuizData(result.data);
    }

    const checkAnswer=(userAnswer,currentQuestion)=>{
        // If user already answered this question, don't allow another answer
        if (userAnswers[currentQuestion?.id || stepCount]) {
            return;
        }
        
        // Save the user's answer
        setUserAnswers(prev => ({
            ...prev,
            [currentQuestion?.id || stepCount]: userAnswer
        }));

        console.log(currentQuestion?.answer,userAnswer);
        if(userAnswer==currentQuestion?.answer)
        {
            setScore(prev => prev + 1);
            setIsCorrectAnswer(true);
            setCorrectAns(currentQuestion?.answer);
            return;
        }
        setIsCorrectAnswer(false);
    }

    useEffect(()=>{
        setCorrectAns(null);
        setIsCorrectAnswer(null);
        
        // Check if we've reached the end of the quiz
        if (quiz && quiz.length > 0 && stepCount >= quiz.length) {
            setIsFinished(true);
        }
    },[stepCount, quiz])
    
    // Function to restart the quiz
    const restartQuiz = () => {
        setStepCount(0);
        setIsFinished(false);
        setScore(0);
        setUserAnswers({});
        setIsCorrectAnswer(null);
        setCorrectAns(null);
    }

  return (
    <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <Link href={`/course/${courseId}`} className="w-full sm:w-auto">
                <button className="flex items-center justify-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Course
                </button>
            </Link>
            <h2 className='font-bold text-xl sm:text-2xl'>Quiz</h2>
            <div className="hidden sm:block w-[120px]"></div> {/* Empty div for balance on larger screens */}
        </div>

        <StepProgress data={quiz} stepCount={stepCount} setStepCount={(value)=>setStepCount(value)} />

        <div>
            {quiz && quiz.length > 0 && stepCount < quiz.length ? (
                <QuizCardItem 
                    quiz={quiz[stepCount]}
                    userSelectedOption={(v)=>checkAnswer(v,quiz[stepCount])}
                    userAnswer={userAnswers[quiz[stepCount]?.id || stepCount]}
                    blocked={userAnswers[quiz[stepCount]?.id || stepCount] !== undefined || isCorrectAns !== null}
                />
            ) : !isFinished ? (
                <div className="p-4 border rounded-lg text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading quiz questions...</p>
                    </div>
                </div>
            ) : null}
        </div>

        {isCorrectAns==false && quiz && quiz.length > 0 && stepCount < quiz.length && <div className="mt-4">
            <div className='border p-3 border-red-700 bg-red-200 rounded-lg'>
                <h2 className='font-bold text-lg text-red-600'>Incorrect</h2>
                <p className='text-red-600 break-words'>Correct Answer is: {quiz[stepCount]?.answer || correctAns}</p>
            </div>
        </div>}
       
        {isCorrectAns==true && <div className="mt-4">
            <div className='border p-3 border-green-700 bg-green-100 rounded-lg'>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h2 className='font-bold text-lg text-green-600'>Correct!</h2>
                        <p className='text-green-600'>Your answer is correct!</p>
                    </div>
                    <button 
                        onClick={() => setStepCount(stepCount + 1)}
                        className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Next Question
                    </button>
                </div>
            </div>
        </div>}
   
        {isFinished && (
            <div className="mt-8 p-4 sm:p-6 border rounded-lg bg-blue-50 text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-6 text-blue-600">
                    {score} / {quiz.length}
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                        onClick={restartQuiz}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retake Quiz
                    </button>
                    <Link href={`/course/${courseId}`} className="w-full sm:w-auto">
                        <button className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            Back to Course
                        </button>
                    </Link>
                </div>
            </div>
        )}

    </div>
  )
}

export default Quiz