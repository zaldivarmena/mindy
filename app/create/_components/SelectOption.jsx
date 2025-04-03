import Image from 'next/image'
import React, { useState } from 'react'

function SelectOption({selectedStudyType}) {
    const Options=[
        {
            name:'Exam',
            icon:'/exam_1.png'
        },
        {
            name:'Job Prep',
            icon:'/job.png'
        },
        {
            name:'Skills',
            icon:'/practice.png'
        },
        {
            name:'Coding & Tech',
            icon:'/code.png'
        },
        {
            name:'Other',
            icon:'/knowledge.png'
        },

    ]
    const [selectedOption,setSelectedOption]=useState();
  return (
    <div >
        <h2 className='text-center mb-2 text-lg'>Choose your next study topic</h2>
        <div className='grid grid-cols-2 mt-5 md:grid-cols-3 lg:grid-cols-5 gap-5'>
            {Options.map((option,index)=>(
                <div key={index} 
                className={`p-4 flex flex-col items-center justify-center 
                border rounded-xl hover:bg-secondary cursor-pointer font-bold ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-100
                ${option?.name==selectedOption&&'bg-primary text-white'}`}
                onClick={()=>{setSelectedOption(option.name);selectedStudyType(option.name)}}
                >
                    <Image src={option.icon} alt={option.name} width={50} height={50} />
                    <h2 className='text-sm mt-2'>{option.name}</h2>
                </div>
            ))}
        </div>
    </div>
  )
}

export default SelectOption