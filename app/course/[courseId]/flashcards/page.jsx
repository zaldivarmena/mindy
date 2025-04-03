"use client"
import axios from 'axios';
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"
import StepProgress from '../_components/StepProgress';
import FlashcardItem from './_components/FlashcardItem';
  
function Flashcards() {

    const {courseId}=useParams();
    const [flashCards,setFlashCards]=useState([]);
    const [isFlipped,setIsFlipped]=useState();
    const [api,setApi]=useState();
    // const [stepCount,setStepCount]=useState(0)

    useEffect(()=>{
        GetFlashCards();
    },[])

    useEffect(()=>{
        if(!api)
        {
            return ;
        }
        api.on('select',()=>{
            setIsFlipped(false);
        })
    },[api])

    const GetFlashCards=async()=>{
        const result=await axios.post('/api/study-type',{
            courseId:courseId,
            studyType:'Flashcard'
        });

        setFlashCards(result?.data);
       
    }

    const handleClick=(index)=>{
        setIsFlipped(!isFlipped)
    }
    
  return (
    <div className="px-2 sm:px-4 md:px-6">
        <h2 className='font-bold text-xl sm:text-2xl'>Flashcards</h2>
        <p className="text-sm sm:text-base">Flashcards: The Ultimate Tool to Lock in Concepts!</p>

        <div className='mt-6 sm:mt-10'>
        {/* <StepProgress data={flashCards?.content} 
        setStepCount={(v)=>setStepCount(v)} 
        stepCount={stepCount} /> */}

        <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
            {flashCards?.content && flashCards.content?.length > 0 ? (
              flashCards.content.map((flashcard, index) => (
                <CarouselItem key={index} className="flex items-center justify-center">
                  <FlashcardItem 
                    handleClick={handleClick} 
                    isFlipped={isFlipped}
                    flashcard={flashcard}
                  />
                </CarouselItem>
              ))
            ) : (
              <CarouselItem className="flex items-center justify-center h-[200px] sm:h-[250px] md:h-[350px]">
                <div className="text-center p-4 bg-gray-100 rounded-lg shadow-md">
                  <p>No flashcards available for this course.</p>
                </div>
              </CarouselItem>
            )}
        </CarouselContent>
        <div className="flex justify-center mt-4 gap-2">
          <CarouselPrevious className="relative left-0 translate-x-0 sm:absolute" />
          <CarouselNext className="relative right-0 translate-x-0 sm:absolute" />
        </div>
      </Carousel>

        </div>
        <div className="mt-6 sm:mt-8 flex justify-center">
          <Link href={`/course/${courseId}`}>
            <Button variant="outline" className="flex items-center gap-2 text-sm sm:text-base">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              Back to Course
            </Button>
          </Link>
        </div>

  
    </div>
  )
}

export default Flashcards