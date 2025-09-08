'use client';

import React, { useState } from 'react';
import FaithDashboard from './FaithDashboard';
import SalatTracker from './SalatTracker';
import QuranReader from './QuranReader';
import HadithDuasLibrary from './HadithDuasLibrary';
import AzkarReminders from './AzkarReminders';

export default function UnifiedFaithDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'salat' | 'quran' | 'hadith' | 'azkar'>('dashboard');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faith Module</h1>
          <p className="text-gray-600">Complete Islamic spiritual tracking and resources</p>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-green-600 mr-2">🕌</span>
          <div>
            <h4 className="font-medium text-green-800">Islamic Faith Module</h4>
            <p className="text-sm text-green-700">
              Track your daily prayers, read the Quran with translations, explore hadith and duas, and set up azkar reminders.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'salat', label: 'Salat Tracker', icon: '🕌' },
            { id: 'quran', label: 'Quran Reader', icon: '📖' },
            { id: 'hadith', label: 'Hadith & Duas', icon: '📜' },
            { id: 'azkar', label: 'Azkar Reminders', icon: '🔔' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <FaithDashboard />}
        {activeTab === 'salat' && <SalatTracker />}
        {activeTab === 'quran' && <QuranReader />}
        {activeTab === 'hadith' && <HadithDuasLibrary />}
        {activeTab === 'azkar' && <AzkarReminders />}
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Faith Module Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">🕌</div>
            <h4 className="font-semibold text-gray-900 mb-2">Salat Tracking</h4>
            <p className="text-sm text-gray-600">
              Log your five daily prayers, track streaks, and monitor completion rates with detailed statistics.
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-3">📖</div>
            <h4 className="font-semibold text-gray-900 mb-2">Quran Reader</h4>
            <p className="text-sm text-gray-600">
              Read the Holy Quran with Arabic text, English and Dhivehi translations, and audio recitation.
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-3">📜</div>
            <h4 className="font-semibold text-gray-900 mb-2">Hadith Library</h4>
            <p className="text-sm text-gray-600">
              Explore authentic hadith from major collections with search, categorization, and grading.
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-3">🤲</div>
            <h4 className="font-semibold text-gray-900 mb-2">Duas Collection</h4>
            <p className="text-sm text-gray-600">
              Access comprehensive duas for various occasions with Arabic text and translations.
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-3">🔔</div>
            <h4 className="font-semibold text-gray-900 mb-2">Azkar Reminders</h4>
            <p className="text-sm text-gray-600">
              Set up notifications for morning, evening, and other azkar to maintain regular remembrance.
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-3">📊</div>
            <h4 className="font-semibold text-gray-900 mb-2">Progress Tracking</h4>
            <p className="text-sm text-gray-600">
              Monitor your spiritual progress with detailed analytics and streak tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Islamic Resources */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📚 Islamic Resources</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-2">🕌 Prayer Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Track all five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)</li>
              <li>• Mark prayers as completed, missed, or made up (Qada)</li>
              <li>• Track congregation prayers separately</li>
              <li>• View prayer streaks and completion statistics</li>
              <li>• Monthly and yearly prayer analytics</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-blue-900 mb-2">📖 Quran Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete Quran with 114 surahs</li>
              <li>• Arabic text with English and Dhivehi translations</li>
              <li>• Audio recitation for each verse</li>
              <li>• Search functionality across translations</li>
              <li>• Reading session tracking and progress</li>
              <li>• Bookmark favorite verses</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-blue-900 mb-2">📜 Hadith & Duas</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Authentic hadith from major collections</li>
              <li>• Hadith grading (Sahih, Hasan, Daif, Mawdu)</li>
              <li>• Comprehensive duas for various occasions</li>
              <li>• Search by text, narrator, or category</li>
              <li>• Bookmark important hadith and duas</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-blue-900 mb-2">🔔 Azkar & Reminders</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Morning and evening azkar collections</li>
              <li>• Post-prayer and bedtime remembrance</li>
              <li>• Customizable reminder schedules</li>
              <li>• Daily, weekly, or custom frequency</li>
              <li>• Push notifications for timely reminders</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Prayer Times Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⏰ Prayer Times</h4>
        <p className="text-sm text-yellow-800">
          Prayer times shown are approximate. Please consult your local mosque or Islamic center for accurate prayer times in your area. 
          Consider using dedicated prayer time apps that account for your specific location and calculation method.
        </p>
      </div>

      {/* Data Sources */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">📚 Data Sources</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Quran:</strong> Text from the Mushaf of Madinah with verified translations</p>
          <p><strong>Hadith:</strong> Collections include Sahih Bukhari, Sahih Muslim, and other authentic sources</p>
          <p><strong>Duas:</strong> Sourced from Quran, authentic Sunnah, and classical Islamic literature</p>
          <p><strong>Azkar:</strong> Based on traditional morning/evening remembrance from authentic sources</p>
        </div>
      </div>
    </div>
  );
}
