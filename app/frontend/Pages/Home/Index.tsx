import React from 'react'
import { PageProps } from '@/types'
import Layout from '@/components/layout/layout'

interface HomeProps extends PageProps {
  message: string
}

export default function Index({ message }: HomeProps) {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to FPL Clone! ⚽
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            {message}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Build Your Squad</h3>
              <p className="text-gray-600">
                Pick 15 players within budget
              </p>
            </div>
            
            <div className="p-6 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Make Transfers</h3>
              <p className="text-gray-600">
                Improve your team every week
              </p>
            </div>
            
            <div className="p-6 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Join Leagues</h3>
              <p className="text-gray-600">
                Compete with friends
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}