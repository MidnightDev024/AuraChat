import React, { useEffect, useRef, useState } from 'react';
import assets from '../assets/assets.js';
import toast from 'react-hot-toast';
import { formateMessageTime } from '../library/utils.js';
import { chatContext } from "../context/chatContext.jsx";
import { authContext } from '../context/authContext.jsx';
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import NoChatSelected from './NoChatSelected.jsx';
import MessageSkeleton from './skeletons/MessageSkeleton.jsx';
import { useThemeStore } from '../store/useThemeStore.js';

const ChatContainer = () => {

  const {messages, selectedUser, setSelectedUser, sendMessage, getMessages, clearMessages, setRightSidebarOpen, removeMessage, isLoadingMessages} = React.useContext(chatContext);

  const { axios } = React.useContext(authContext);

  const {authUser, onlineUsers} = React.useContext(authContext);
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  const scrollEnd = useRef();

  const headerMenuRef = useRef();

  const [input, setInput] = useState('');

  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Dropdown 1: Emoji & GIF picker state
  const [showEmojiGifDropdown, setShowEmojiGifDropdown] = useState(false);
  const [activeEmojiGifTab, setActiveEmojiGifTab] = useState('emoji'); // 'emoji' or 'gif'
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const emojiGifDropdownRef = useRef();

  // Dropdown 2: Media & Files picker state
  const [showMediaDropdown, setShowMediaDropdown] = useState(false);
  const mediaDropdownRef = useRef();

  // Giphy setup - API key from environment variable
  const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || '');

  // handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if(input.trim() === "") return null;
    await sendMessage({text : input.trim()});
    setInput("");
  }

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
  }  

  // Handle GIF selection
  const handleGifClick = async (gif, e) => {
    e.preventDefault();
    await sendMessage({ image: gif.images.fixed_height.url });
    setShowEmojiGifDropdown(false);
    setGifSearchTerm('');
  };

  // Fetch GIFs for Giphy Grid
  const fetchGifs = (offset) => {
    if (gifSearchTerm.trim()) {
      return gf.search(gifSearchTerm, { offset, limit: 10 });
    }
    return gf.trending({ offset, limit: 10 });
  };

  // Handle sending an image from gallery
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if(!file || !file.type.startsWith('image/')){
      toast.error('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({image: reader.result});
      e.target.value = "";
    }
    reader.readAsDataURL(file);
    setShowMediaDropdown(false);
  }

  // Handle sending a file
  const handleSendFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ 
        file: reader.result, 
        fileName: file.name, 
        fileType: file.type 
      });
      e.target.value = "";
    }
    reader.readAsDataURL(file);
    setShowMediaDropdown(false);
  }

  // Handle delete message for me
  const handleDeleteForMe = async (messageId) => {
    try {
      const { data } = await axios.delete(`/api/messages/delete-for-me/${messageId}`);
      if (data.success) {
        removeMessage(messageId);
        toast.success('Message deleted');
      } else {
        toast.error(data.message || 'Could not delete message');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Delete failed');
    }
    setShowDeleteMenu(null);
  }

  // Handle delete message for everyone
  const handleDeleteForEveryone = async (messageId) => {
    try {
      const { data } = await axios.delete(`/api/messages/delete-for-everyone/${messageId}`);
      if (data.success) {
        removeMessage(messageId);
        toast.success('Message deleted for everyone');
      } else {
        toast.error(data.message || 'Could not delete message');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Delete failed');
    }
    setShowDeleteMenu(null);
  }

  useEffect(()=>{
    if(selectedUser){
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(()=>{
    if(scrollEnd.current && messages){
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  },[messages]);

  // Close header menu on outside click
  useEffect(() => {
    const  handleClickOutside = (event) => {
      if (showHeaderMenu && headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
      // Close emoji/gif dropdown when clicking outside
      if (showEmojiGifDropdown && emojiGifDropdownRef.current && !emojiGifDropdownRef.current.contains(event.target)) {
        setShowEmojiGifDropdown(false);
      }
      // Close media dropdown when clicking outside
      if (showMediaDropdown && mediaDropdownRef.current && !mediaDropdownRef.current.contains(event.target)) {
        setShowMediaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeaderMenu, showEmojiGifDropdown, showMediaDropdown]);

  return selectedUser ?  (
      <div
        className='theme-panel h-full overflow-scroll relative'
        style={{
          backgroundImage: isLight ? 'none' : `url(${assets.chatBg})`,
          backgroundColor: isLight ? 'var(--theme-chat-bg)' : undefined,
          backgroundSize: 'cover',
        }}
      >
      {/* ---------- Header -------------- */}
      <div
        className='flex items-center gap-3 py-3 mx-4 border-b relative'
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <img src={selectedUser?.profilePicture || assets.avatar_icon} alt="User Profile Pic" className='w-8 rounded-full'/>
        <p className='flex-1 text-lg flex items-center gap-2' style={{ color: 'var(--theme-text-primary)' }}>
          {selectedUser?.fullName || selectedUser?.fullname || 'Unknown'}
          {((onlineUsers || []).includes(selectedUser._id)) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </p>
          <div className='flex items-center gap-3' ref={headerMenuRef}>
          <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
          <img 
            onClick={() => setShowHeaderMenu(prev => !prev)} 
            src={assets.menu_icon} 
            alt="Menu" 
            className={`max-w-6 cursor-pointer ${isLight ? 'opacity-60' : ''}`}
          />
          {/* Header Dropdown Menu */}
          {showHeaderMenu && (
            <div
              className='absolute top-14 right-4 rounded-lg shadow-lg py-1 z-10 min-w-[150px]'
              style={{ background: 'var(--theme-dropdown-bg)' }}
            >
              <button
                onClick={() => {
                  setRightSidebarOpen(prev => !prev);
                  setShowHeaderMenu(false);
                }}
                className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-80'
                style={{ color: 'var(--theme-text-primary)' }}
              >
                <img src={assets.info_icon} alt="Info" className='w-4 h-4' />
                Info
              </button>
              <button
                onClick={async () => {
                  setShowHeaderMenu(false);
                  const ok = window.confirm('Delete this conversation? This cannot be undone.');
                  if(!ok) return;
                  try{
                    const { data } = await axios.delete(`/api/messages/clear/${selectedUser._id}`);
                    if(data.success){
                      clearMessages();
                      setSelectedUser(null);
                      toast.success('Conversation deleted');
                    } else {
                      toast.error(data.message || 'Could not delete conversation');
                    }
                  } catch(err){
                    toast.error(err?.response?.data?.message || err.message || 'Delete failed');
                  }
                }}
                className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:opacity-80 transition-colors'
              >
                <span className='w-4 h-4 flex items-center justify-center text-base'>🗑️</span>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {/* ---------- chat area ------------ */}
      {isLoadingMessages ? (
        <MessageSkeleton />
      ) : (
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.filter(Boolean).map((msg, index)=> {
          const isSender = msg.senderId === authUser._id;
          return (
            <div 
              key={index} 
              className={`flex items-end gap-2 justify-end ${!isSender && 'flex-row-reverse'} relative group`}
              onMouseEnter={() => setHoveredMessageId(msg._id)}
              onMouseLeave={() => {
                setHoveredMessageId(null);
                if(showDeleteMenu !== msg._id) setShowDeleteMenu(null);
              }}
            >
              {msg.image ? (
                <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
              ) : msg.file ? (
                <a
                  href={/^https?:\/\//i.test(msg.file) ? msg.file : undefined}
                  download={msg.fileName || 'file'}
                  rel="noopener noreferrer"
                  className='p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all text-indigo-300 underline underline-offset-2 cursor-pointer'
                  style={{ background: isSender ? 'var(--theme-msg-sent-bg)' : 'var(--theme-msg-received-bg)' }}
                >
                  📄 {msg.fileName || 'Download file'}
                </a>
              ) : (
                <p
                  className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all ${!isSender ? 'rounded-tl-none' : 'rounded-bl-none'}`}
                  style={{
                    background: isSender ? 'var(--theme-msg-sent-bg)' : 'var(--theme-msg-received-bg)',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  {msg.text}
                </p>
              )}
              
              {/* Delete Menu Button */}
              {hoveredMessageId === msg._id && (
                <button
                  onClick={() => setShowDeleteMenu(showDeleteMenu === msg._id ? null : msg._id)}
                  className={`absolute top-0 text-gray-400 hover:text-white px-2 py-1 text-xs ${isSender ? 'right-0' : 'left-0'}`}
                >
                  ⋮
                </button>
              )}
              
              {/* Delete Dropdown Menu */}
              {showDeleteMenu === msg._id && (
                <div
                  className={`absolute top-6 rounded-lg shadow-lg py-1 z-10 ${isSender ? 'right-0' : 'left-0'}`}
                  style={{ background: 'var(--theme-dropdown-bg)' }}
                >
                  <button
                    onClick={() => handleDeleteForMe(msg._id)}
                    className='block w-full text-left px-4 py-2 text-sm whitespace-nowrap hover:opacity-80'
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    Delete for me
                  </button>
                  {isSender && (
                    <button
                      onClick={() => handleDeleteForEveryone(msg._id)}
                      className='block w-full text-left px-4 py-2 text-sm text-red-400 hover:opacity-80 whitespace-nowrap'
                    >
                      Delete for everyone
                    </button>
                  )}
                </div>
              )}
              
              <div className='text-center text-xs'>
                <img src={isSender ? authUser?.profilePicture || assets.avatar_icon : selectedUser?.profilePicture || assets.avatar_icon} alt="" className='w-7 rounded-full' />
                <p style={{ color: 'var(--theme-text-muted)' }}>{formateMessageTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>
      )}
      {/* --------- bottom area --------- */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        {/* Dropdown 1: Emoji & GIF picker */}
        <div className='relative' ref={emojiGifDropdownRef}>
          <button 
            onClick={() => {
              setShowEmojiGifDropdown(prev => !prev);
              setShowMediaDropdown(false);
            }}
            className='w-9 h-9 flex items-center justify-center rounded-full cursor-pointer hover:opacity-80 transition-opacity'
            style={{ background: 'var(--theme-input-bg)' }}
            title="Emoji & GIF"
          >
            <img src={assets.Emoji_icon} alt="Emoji & GIF" className='w-20 rounded-full' />
          </button>
          
          {/* Emoji & GIF Dropdown */}
          {showEmojiGifDropdown && (
            <div
              className='absolute bottom-12 left-0 rounded-lg shadow-lg z-20 overflow-hidden'
              style={{ width: '320px', background: 'var(--theme-dropdown-bg)' }}
            >
              {/* Tabs */}
              <div className='flex border-b' style={{ borderColor: 'var(--theme-border)' }}>
                <button
                  onClick={() => setActiveEmojiGifTab('emoji')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors`}
                  style={{
                    color: activeEmojiGifTab === 'emoji' ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
                    background: activeEmojiGifTab === 'emoji' ? 'var(--theme-input-bg)' : 'transparent',
                  }}
                >
                  😀 Emoji
                </button>
                <button
                  onClick={() => setActiveEmojiGifTab('gif')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors`}
                  style={{
                    color: activeEmojiGifTab === 'gif' ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
                    background: activeEmojiGifTab === 'gif' ? 'var(--theme-input-bg)' : 'transparent',
                  }}
                >
                  🎬 GIF
                </button>
              </div>
              
              {/* Content */}
              <div className='max-h-[300px] overflow-y-auto'>
                {activeEmojiGifTab === 'emoji' ? (
                  <EmojiPicker 
                    onEmojiClick={handleEmojiClick} 
                    theme={isLight ? "light" : "dark"}
                    width="100%"
                    height={280}
                    searchDisabled={false}
                    skinTonesDisabled={false}
                    previewConfig={{ showPreview: false }}
                  />
                ) : (
                  <div className='p-2'>
                    <input
                      type="text"
                      placeholder="Search GIFs..."
                      value={gifSearchTerm}
                      onChange={(e) => setGifSearchTerm(e.target.value)}
                      className='w-full px-3 py-2 rounded-lg text-sm outline-none mb-2'
                      style={{
                        background: 'var(--theme-input-bg)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                    <div className='h-[220px] overflow-y-auto'>
                      <Grid 
                        key={gifSearchTerm}
                        width={296} 
                        columns={2} 
                        fetchGifs={fetchGifs}
                        onGifClick={handleGifClick}
                        noLink={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dropdown 2: Media & Files picker */}
        <div className='relative' ref={mediaDropdownRef}>
          <button 
            onClick={() => {
              setShowMediaDropdown(prev => !prev);
              setShowEmojiGifDropdown(false);
            }}
            className='w-9 h-9 flex items-center justify-center rounded-full cursor-pointer hover:opacity-80 transition-opacity'
            style={{ background: 'var(--theme-input-bg)' }}
            title="Attach Files"
          >
            <span className='text-xl'>📎</span>
          </button>
          
          {/* Media & Files Dropdown */}
          {showMediaDropdown && (
            <div
              className='absolute bottom-12 left-0 rounded-lg shadow-lg z-20 py-2 min-w-[160px]'
              style={{ background: 'var(--theme-dropdown-bg)' }}
            >
              {/* Gallery Option */}
              <label
                htmlFor="gallery-image"
                className='flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:opacity-80'
                style={{ color: 'var(--theme-text-primary)' }}
              >
                <img src={assets.gallery_icon} alt="" className='w-5' />
                <span>Gallery</span>
              </label>
              <input 
                onChange={handleSendImage} 
                type="file" 
                id="gallery-image" 
                accept='image/png, image/jpeg, image/gif, image/webp' 
                hidden 
              />
              
              {/* File Transfer Option */}
              <label
                htmlFor="file-transfer"
                className='flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:opacity-80'
                style={{ color: 'var(--theme-text-primary)' }}
              >
                <span className='text-lg'>📄</span>
                <span>File</span>
              </label>
              <input 
                onChange={handleSendFile} 
                type="file" 
                id="file-transfer" 
                hidden 
              />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div
          className='theme-input flex-1 flex items-center px-3 rounded-full'
          style={{ background: 'var(--theme-input-bg)' }}
        >
          <input 
            onChange={(e) => setInput(e.target.value)} 
            value={input} 
            onKeyDown={(e)=> e.key === "Enter" ? handleSendMessage(e) : null} 
            type="text" 
            placeholder='Send a message...' 
            className='flex-1 text-sm p-3 border-none rounded-lg outline-none bg-transparent'
            style={{ color: 'var(--theme-text-primary)' }}
          />
        </div>
        
        {/* Send Button */}
        <img 
          src={assets.send_button} 
          alt="Send" 
          onClick={handleSendMessage}
          className='w-7 cursor-pointer hover:opacity-80 transition-opacity'
        />
      </div>
    </div>
  ) : (
    <NoChatSelected />
  )
}

export default ChatContainer;