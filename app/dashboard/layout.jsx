"use client"
import React, { useState } from 'react'
import SideBar from './_components/SideBar'
import { CourseCountContext } from '../_context/CourseCountContext'

function DashboardLayout({children}) {
    const [totalCourse,setTotalCourse]=useState(0);
  return (
    <CourseCountContext.Provider value={{totalCourse,setTotalCourse}}>
    <div className="relative">
        {/* The sidebar with highest z-index to ensure it's always on top on mobile */}
        <div className='w-full md:w-64 fixed top-0 left-0 md:left-auto md:top-auto z-50'>
            <SideBar/>
        </div>
        {/* Main content with lower z-index */}
        <div className='md:ml-64 relative z-10'>
            <div className='p-10'>
                {children}
            </div>
        </div>
        </div>
     </CourseCountContext.Provider>
  )
}

export default DashboardLayout