import React, { useState, useEffect } from 'react';

const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'; // Public beta key

const GifPicker = ({ onGifSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch trending GIFs on mount
  useEffect(() => {
    fetchTrendingGifs();
  }, []);

  const fetchTrendingGifs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
    }
    setLoading(false);
  };

  const searchGifs = async (query) => {
    if (!query.trim()) {
      fetchTrendingGifs();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    }
    setLoading(false);
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchGifs(search);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleGifSelect = (gif) => {
    const gifUrl = gif.images?.fixed_height?.url || gif.images?.original?.url;
    if (gifUrl) {
      onGifSelect(gifUrl);
      onClose();
    }
  };

  return (
    <div className='absolute bottom-16 left-0 z-50'>
      <div 
        className='fixed inset-0' 
        onClick={onClose}
      />
      <div className='relative bg-gray-800 rounded-lg shadow-lg w-[320px] h-[400px] flex flex-col overflow-hidden'>
        {/* Search input */}
        <div className='p-2 border-b border-gray-700'>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search GIFs...'
            className='w-full px-3 py-2 bg-gray-700 text-white rounded-lg outline-none text-sm placeholder-gray-400'
          />
        </div>
        
        {/* GIF grid */}
        <div className='flex-1 overflow-y-auto p-2'>
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-gray-400'>Loading...</div>
            </div>
          ) : (
            <div className='grid grid-cols-2 gap-2'>
              {gifs.map((gif) => (
                <div
                  key={gif.id}
                  onClick={() => handleGifSelect(gif)}
                  className='cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity'
                >
                  <img
                    src={gif.images?.fixed_height_small?.url || gif.images?.preview_gif?.url}
                    alt={gif.title}
                    className='w-full h-24 object-cover'
                    loading='lazy'
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* GIPHY attribution */}
        <div className='p-2 border-t border-gray-700 text-center'>
          <span className='text-xs text-gray-500'>Powered by GIPHY</span>
        </div>
      </div>
    </div>
  );
};

export default GifPicker;
