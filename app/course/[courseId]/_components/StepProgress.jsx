import { Button } from '@/components/ui/button'
import React from 'react'

function StepProgress({stepCount,setStepCount,data=[]}) {
  // Add a default empty array and ensure data exists before accessing length
  const isLastStep = Array.isArray(data) && stepCount >= data.length

  return (
    <div className='flex gap-5 items-center'>
           {stepCount!=0 && <Button variant="outline" size="sm" onClick={()=>setStepCount(stepCount-1)}>Previous</Button>}
            {Array.isArray(data) && data.length > 0 ? (
              data.map((item,index)=>(
                <div key={index} className={`w-full h-2 rounded-full
                ${index<stepCount?'bg-primary':'bg-gray-200'}`}>
                </div>
              ))
            ) : (
              // Fallback when no data is available
              <div className="w-full h-2 rounded-full bg-gray-200"></div>
            )}
            <Button variant="outline" size="sm" disabled={isLastStep} onClick={()=>setStepCount(stepCount+1)}>Next</Button>

        </div>
  )
}

export default StepProgress