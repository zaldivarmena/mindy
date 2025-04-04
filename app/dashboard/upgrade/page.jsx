"use client"
import { Button } from '@/components/ui/button'
import { db } from '@/configs/db'
import { USER_TABLE } from '@/configs/schema'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { eq } from 'drizzle-orm'
import React, { useEffect, useState } from 'react'

function Upgrade() {

  const {user}=useUser();
  const [userDetail,setUserDetail]=useState();

  useEffect(()=>{
    user&&GetUserDetail();
  },[user])

  const GetUserDetail=async()=>{

    const result=await db.select().from(USER_TABLE)
    .where(eq(USER_TABLE.email,user?.primaryEmailAddress?.emailAddress));

    setUserDetail(result[0]);

  }

  const OnCheckoutClick=async()=>{
    const result=await axios.post('/api/payment/checkout',{
      priceId:process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY});

    console.log(result.data);
    window.open(result.data?.url)
  }

  const onPaymentMange=async()=>{
    const result=await axios.post('/api/payment/manage-payment',{
      customerId:userDetail?.customerId
    })

    console.log(result.data);
    window.open(result.data?.url)

  }
  return (
    <div className="px-4 py-8 relative z-0">
      <h2 className='font-medium text-3xl mb-2'>Plans</h2>
      <p className="text-muted-foreground mb-8">Update your plan to generate unlimited courses for your exam</p>
  
      <div className="mx-auto max-w-5xl relative z-0">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 relative z-0">
          {/* Free Plan */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm relative flex flex-col h-full">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Free
                </h2>
                <div className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground">For individuals</div>
              </div>

              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-card-foreground">$0</span>
                <span className="ml-1 text-sm text-muted-foreground">Forever</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">2 Course Generation</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">Limited Support</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">Email support</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">Help center access</span>
              </li>
            </ul>

            {userDetail?.isMember === false ? (
              <Button 
                variant="ghost" 
                className="w-full"
                disabled
              >
                Current Plan
              </Button>
            ) : (
              <Button
                onClick={onPaymentMange}
                variant="outline"
                className="w-full"
              >
                Downgrade
              </Button>
            )}
          </div>

          {/* Premium Plan */}
          <div className="rounded-2xl border border-primary bg-card p-8 shadow-md relative flex flex-col h-full">
            <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">Popular</div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Mindy+
                </h2>
                <div className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground">For individuals</div>
              </div>

              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-card-foreground">$10</span>
                <span className="ml-1 text-sm text-muted-foreground">month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">Unlimited Courses</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">Unlimited Flashcards & Quizzes</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">Email support</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">Help center access</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5 text-primary"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-card-foreground">Priority customer service</span>
              </li>
            </ul>

            {userDetail?.isMember === false ? (
              <Button
                onClick={OnCheckoutClick}
                className="w-full"
              >
                Get started
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={onPaymentMange} 
                className="w-full"
              >
                Manage Plan
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upgrade