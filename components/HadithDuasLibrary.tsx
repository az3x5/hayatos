'use client';

import React, { useState, useEffect } from 'react';

interface HadithCollection {
  id: string;
  name_arabic: string;
  name_english: string;
  name_dhivehi?: string;
  description?: string;
  total_hadith: number;
}

interface Hadith {
  id: string;
  collection_name: string;
  hadith_number: number;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  narrator: string;
  grade: 'sahih' | 'hasan' | 'daif' | 'mawdu';
  category: string;
  reference: string;
  relevance_score?: number;
}

interface Dua {
  id: string;
  title_arabic: string;
  title_english: string;
  title_dhivehi?: string;
  text_arabic: string;
  text_english?: string;
  text_dhivehi?: string;
  transliteration?: string;
  category: string;
  occasion?: string;
  reference?: string;
  audio_url?: string;
  relevance_score?: number;
}

export default function HadithDuasLibrary() {
  const [activeTab, setActiveTab] = useState<'hadith' | 'duas'>('hadith');
  const [collections, setCollections] = useState<HadithCollection[]>([]);
  const [hadithResults, setHadithResults] = useState<Hadith[]>([]);
  const [duasResults, setDuasResults] = useState<Dua[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    fetchCollections();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'hadith') {
      searchHadith();
    } else {
      searchDuas();
    }
  }, [activeTab, searchQuery, selectedCollection, selectedCategory, selectedGrade, selectedOccasion, currentPage]);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/faith/hadith?action=collections');
      const result = await response.json();

      if (response.ok) {
        setCollections(result.data || []);
      } else {
        console.error('Error fetching collections:', result.error);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/faith/hadith?action=categories&type=${activeTab}`);
      const result = await response.json();

      if (response.ok) {
        setCategories(result.data || []);
      } else {
        console.error('Error fetching categories:', result.error);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const searchHadith = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'hadith',
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCollection) params.append('collection_id', selectedCollection);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedGrade) params.append('grade', selectedGrade);

      const response = await fetch(`/api/faith/hadith?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setHadithResults(result.data || []);
        setTotalPages(result.pagination?.total_pages || 1);
        setTotalResults(result.pagination?.total || 0);
      } else {
        console.error('Error searching hadith:', result.error);
      }
    } catch (error) {
      console.error('Error searching hadith:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchDuas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'duas',
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedOccasion) params.append('occasion', selectedOccasion);

      const response = await fetch(`/api/faith/hadith?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setDuasResults(result.data || []);
        setTotalPages(result.pagination?.total_pages || 1);
        setTotalResults(result.pagination?.total || 0);
      } else {
        console.error('Error searching duas:', result.error);
      }
    } catch (error) {
      console.error('Error searching duas:', error);
    } finally {
      setLoading(false);
    }
  };

  const bookmarkItem = async (type: 'hadith' | 'dua', id: string) => {
    try {
      const response = await fetch('/api/faith/hadith?action=bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          reference_id: id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`${type} bookmarked successfully`);
      } else {
        console.error('Error bookmarking:', result.error);
        alert('Error bookmarking: ' + result.error);
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
      alert('Error bookmarking');
    }
  };

  const getGradeBadge = (grade: string) => {
    const colors = {
      sahih: 'bg-green-100 text-green-800',
      hasan: 'bg-blue-100 text-blue-800',
      daif: 'bg-yellow-100 text-yellow-800',
      mawdu: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[grade as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {grade.charAt(0).toUpperCase() + grade.slice(1)}
      </span>
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCollection('');
    setSelectedCategory('');
    setSelectedGrade('');
    setSelectedOccasion('');
    setCurrentPage(1);
  };

  const renderHadith = (hadith: Hadith) => (
    <div key={hadith.id} className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
            #{hadith.hadith_number}
          </span>
          <span className="text-sm text-gray-600">{hadith.collection_name}</span>
          {getGradeBadge(hadith.grade)}
        </div>
        <button
          onClick={() => bookmarkItem('hadith', hadith.id)}
          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
          title="Bookmark hadith"
        >
          🔖
        </button>
      </div>

      <div className="space-y-3">
        {/* Arabic Text */}
        <div className="text-right">
          <p className="text-lg leading-loose font-arabic text-gray-900" dir="rtl">
            {hadith.text_arabic}
          </p>
        </div>

        {/* English Translation */}
        {hadith.text_english && (
          <div className="text-gray-800">
            <p className="leading-relaxed">{hadith.text_english}</p>
          </div>
        )}

        {/* Dhivehi Translation */}
        {hadith.text_dhivehi && (
          <div className="text-gray-800">
            <p className="leading-relaxed" dir="rtl">{hadith.text_dhivehi}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 pt-3 border-t">
        <div>
          <span className="font-medium">Narrator:</span> {hadith.narrator}
        </div>
        <div>
          <span className="font-medium">Category:</span> {hadith.category}
        </div>
        <div>
          <span className="font-medium">Reference:</span> {hadith.reference}
        </div>
      </div>
    </div>
  );

  const renderDua = (dua: Dua) => (
    <div key={dua.id} className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{dua.title_english}</h3>
          <p className="text-sm text-gray-600 text-right" dir="rtl">{dua.title_arabic}</p>
        </div>
        <div className="flex space-x-2">
          {dua.audio_url && (
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Play audio"
            >
              🔊
            </button>
          )}
          <button
            onClick={() => bookmarkItem('dua', dua.id)}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Bookmark dua"
          >
            🔖
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Arabic Text */}
        <div className="text-right">
          <p className="text-xl leading-loose font-arabic text-gray-900" dir="rtl">
            {dua.text_arabic}
          </p>
        </div>

        {/* Transliteration */}
        {dua.transliteration && (
          <div className="text-gray-600 italic">
            <p>{dua.transliteration}</p>
          </div>
        )}

        {/* English Translation */}
        {dua.text_english && (
          <div className="text-gray-800">
            <p className="leading-relaxed">{dua.text_english}</p>
          </div>
        )}

        {/* Dhivehi Translation */}
        {dua.text_dhivehi && (
          <div className="text-gray-800">
            <p className="leading-relaxed" dir="rtl">{dua.text_dhivehi}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 pt-3 border-t">
        <div>
          <span className="font-medium">Category:</span> {dua.category}
        </div>
        {dua.occasion && (
          <div>
            <span className="font-medium">Occasion:</span> {dua.occasion}
          </div>
        )}
        {dua.reference && (
          <div>
            <span className="font-medium">Reference:</span> {dua.reference}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Hadith & Duas Library</h2>
          <p className="text-gray-600">Explore authentic hadith and supplications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'hadith', label: 'Hadith', icon: '📜' },
            { id: 'duas', label: 'Duas', icon: '🤲' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setCurrentPage(1);
                clearFilters();
              }}
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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        {/* Search */}
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {activeTab === 'hadith' && (
            <>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Collections</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name_english}
                  </option>
                ))}
              </select>

              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Grades</option>
                <option value="sahih">Sahih</option>
                <option value="hasan">Hasan</option>
                <option value="daif">Daif</option>
                <option value="mawdu">Mawdu</option>
              </select>
            </>
          )}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {activeTab === 'duas' && (
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Occasions</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="before_sleep">Before Sleep</option>
              <option value="after_prayer">After Prayer</option>
              <option value="travel">Travel</option>
              <option value="eating">Eating</option>
            </select>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {/* Results header */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {totalResults} {activeTab} found
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
          </div>
        ) : (
          /* Results */
          <div className="space-y-4">
            {activeTab === 'hadith' 
              ? hadithResults.map(renderHadith)
              : duasResults.map(renderDua)
            }
            
            {((activeTab === 'hadith' && hadithResults.length === 0) || 
              (activeTab === 'duas' && duasResults.length === 0)) && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📚</div>
                <p>No {activeTab} found matching your criteria.</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📚 About the Library</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Hadith are graded according to traditional Islamic scholarship</li>
          <li>• Duas include authentic supplications from Quran and Sunnah</li>
          <li>• Use bookmarks to save your favorite hadith and duas</li>
          <li>• Audio playback available for selected duas</li>
        </ul>
      </div>
    </div>
  );
}
