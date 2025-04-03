import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'

function QuizCardItem({quiz, userSelectedOption, userAnswer, blocked}) {
    
    const [selectedOption,setSelectedOption]=useState(userAnswer);

  return (
    <div className='mt-10 p-5'>
        {quiz ? (
            <>
                <h2 className='font-medium text-3xl text-center'>{quiz.question}</h2>

                <div className='grid grid-cols-2 gap-5 mt-6'>
                    {Array.isArray(quiz.options) && quiz.options.map((option, index) => (
                        <h2 
                            onClick={() => {
                                if (blocked) return; // Prevent clicking if blocked
                                setSelectedOption(option);
                                userSelectedOption(option);
                            }}
                            key={index} 
                            variant="outline"
                            className={`w-full border rounded-full p-3 px-4 text-center
                            text-lg ${!blocked ? 'hover:bg-gray-200 cursor-pointer' : 'cursor-default'}
                            ${selectedOption==option ? 'bg-primary text-white hover:bg-primary' : ''}
                            ${blocked && option === quiz?.answer ? 'bg-green-500 text-white' : ''}
                            ${blocked && selectedOption==option && option !== quiz?.answer ? 'bg-red-500 text-white' : ''}`}
                        >
                            {option}
                        </h2>
                    ))}
                </div>
            </>
        ) : (
            <div className="text-center">
                <p>Loading question...</p>
            </div>
        )}
    </div>
  )
}

export default QuizCardItem