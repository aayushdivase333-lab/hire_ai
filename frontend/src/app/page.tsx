'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Automate Your LinkedIn Job Follow-Ups
          </h1>
          <p className="text-xl text-gray-700 mb-12">
            Send professional follow-up emails to recruiters with one click. Save time and increase your chances of getting hired.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link href="/signup" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-3">
              Log In
            </Link>
          </div>

          <div className="card text-left">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Install Chrome Extension</h3>
                  <p className="text-gray-600">
                    Install our browser extension to automatically fetch your LinkedIn job applications.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Configure Your Profile</h3>
                  <p className="text-gray-600">
                    Set up your email template, upload your resume, and customize your settings.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Send Follow-Ups</h3>
                  <p className="text-gray-600">
                    Review your applications and send professional follow-up emails with your resume attached.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="font-bold text-lg mb-2">Save Time</h3>
              <p className="text-gray-600">
                No more manually writing follow-up emails. Automate the process and focus on interview prep.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold text-lg mb-2">Professional Templates</h3>
              <p className="text-gray-600">
                Use proven email templates that get responses. Fully customizable to your style.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold text-lg mb-2">Track Everything</h3>
              <p className="text-gray-600">
                See which emails were sent, when, and track your follow-up history in one dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
