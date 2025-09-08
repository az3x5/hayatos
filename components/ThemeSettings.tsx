'use client';

import React, { useState, useEffect } from 'react';

interface ThemeSettings {
  id: string;
  user_id: string;
  theme_name: 'light' | 'dark' | 'islamic' | 'auto';
  custom_colors: any;
  font_family: string;
  font_size: 'small' | 'medium' | 'large' | 'extra_large';
  arabic_font: string;
  compact_mode: boolean;
  animations_enabled: boolean;
  high_contrast: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

export default function ThemeSettings() {
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors>({
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#10b981',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
  });

  const themes = [
    {
      name: 'light',
      label: 'Light',
      description: 'Clean and bright interface',
      preview: 'bg-white border-gray-200',
      icon: '☀️',
    },
    {
      name: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      preview: 'bg-gray-900 border-gray-700',
      icon: '🌙',
    },
    {
      name: 'islamic',
      label: 'Islamic',
      description: 'Green theme inspired by Islamic aesthetics',
      preview: 'bg-green-50 border-green-200',
      icon: '🕌',
    },
    {
      name: 'auto',
      label: 'Auto',
      description: 'Follows your system preference',
      preview: 'bg-gradient-to-r from-white to-gray-900',
      icon: '🔄',
    },
  ];

  const fonts = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Poppins',
    'Nunito',
    'Source Sans Pro',
  ];

  const arabicFonts = [
    'Amiri',
    'Scheherazade New',
    'Noto Sans Arabic',
    'Cairo',
    'Tajawal',
    'Almarai',
  ];

  const fontSizes = [
    { value: 'small', label: 'Small', example: 'text-sm' },
    { value: 'medium', label: 'Medium', example: 'text-base' },
    { value: 'large', label: 'Large', example: 'text-lg' },
    { value: 'extra_large', label: 'Extra Large', example: 'text-xl' },
  ];

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/theme');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch theme');
      }

      setTheme(result.data);
      
      // Load custom colors if they exist
      if (result.data.custom_colors?.colors) {
        setCustomColors(result.data.custom_colors.colors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch theme');
      console.error('Error fetching theme:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = async (updates: Partial<ThemeSettings>) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update theme');
      }

      setTheme(result.data);
      setSuccessMessage('Theme updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
      console.error('Error updating theme:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (themeName: string) => {
    updateTheme({ theme_name: themeName as any });
  };

  const handleCustomThemeSave = async () => {
    try {
      const response = await fetch('/api/settings/theme?action=custom_theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Custom Theme',
          colors: customColors,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save custom theme');
      }

      setTheme(result.data);
      setShowCustomTheme(false);
      setSuccessMessage('Custom theme saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save custom theme');
      console.error('Error saving custom theme:', err);
    }
  };

  const handleResetTheme = async () => {
    if (!confirm('Are you sure you want to reset to default theme?')) {
      return;
    }

    try {
      const response = await fetch('/api/settings/theme?action=reset', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset theme');
      }

      setTheme(result.data);
      setSuccessMessage('Theme reset successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset theme');
      console.error('Error resetting theme:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading theme settings...</p>
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load theme settings</p>
        <button
          onClick={fetchTheme}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Theme & Appearance</h2>
        <p className="text-gray-600">Customize the look and feel of your interface</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Theme Selection */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {themes.map((themeOption) => (
            <button
              key={themeOption.name}
              onClick={() => handleThemeChange(themeOption.name)}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme.theme_name === themeOption.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-full h-16 rounded-lg mb-3 ${themeOption.preview}`}></div>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{themeOption.icon}</span>
                  <span className="font-medium">{themeOption.label}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{themeOption.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex space-x-3">
          <button
            onClick={() => setShowCustomTheme(!showCustomTheme)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showCustomTheme ? 'Hide' : 'Create'} Custom Theme
          </button>
          
          <button
            onClick={handleResetTheme}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset to Default
          </button>
        </div>
      </div>

      {/* Custom Theme Creator */}
      {showCustomTheme && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Theme</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(customColors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCustomThemeSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Custom Theme
            </button>
            
            <button
              onClick={() => setShowCustomTheme(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Typography */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={theme.font_family}
              onChange={(e) => updateTheme({ font_family: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fonts.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arabic Font
            </label>
            <select
              value={theme.arabic_font}
              onChange={(e) => updateTheme({ arabic_font: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {arabicFonts.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <select
              value={theme.font_size}
              onChange={(e) => updateTheme({ font_size: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fontSizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Compact Mode</h4>
              <p className="text-sm text-gray-600">Reduce spacing and padding for more content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={theme.compact_mode}
                onChange={(e) => updateTheme({ compact_mode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Animations</h4>
              <p className="text-sm text-gray-600">Enable smooth transitions and animations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={theme.animations_enabled}
                onChange={(e) => updateTheme({ animations_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">High Contrast</h4>
              <p className="text-sm text-gray-600">Increase contrast for better accessibility</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={theme.high_contrast}
                onChange={(e) => updateTheme({ high_contrast: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        
        <div className="border rounded-lg p-4 space-y-3" style={{ 
          fontFamily: theme.font_family,
          fontSize: theme.font_size === 'small' ? '14px' : 
                   theme.font_size === 'medium' ? '16px' :
                   theme.font_size === 'large' ? '18px' : '20px'
        }}>
          <h4 className="font-semibold">Sample Content</h4>
          <p>This is how your text will appear with the current settings.</p>
          <p className="text-right" style={{ fontFamily: theme.arabic_font }}>
            هذا نص تجريبي باللغة العربية
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Button</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm">Secondary</button>
          </div>
        </div>
      </div>
    </div>
  );
}
