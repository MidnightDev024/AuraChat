import React, { useEffect, useRef } from 'react';
import assets from '../assets/assets.js';
import toast from 'react-hot-toast';
import { formateMessageTime } from '../library/utils.js';
import { chatContext } from "../context/chatContext.jsx";
import { authContext } from '../context/authContext.jsx';
import EmojiPicker from 'emoji-picker-react';

const ChatContainer = () => {

  const {messages, selectedUser, setSelectedUser, sendMessage, getMessages, clearMessages, setRightSidebarOpen, removeMessage} = React.useContext(chatContext);

  const { axios } = React.useContext(authContext);

  const {authUser, onlineUsers} = React.useContext(authContext);

  const scrollEnd = useRef();

  const headerMenuRef = useRef();

  const [input, setInput] = React.useState('');

  const [hoveredMessageId, setHoveredMessageId] = React.useState(null);

  const [showDeleteMenu, setShowDeleteMenu] = React.useState(false);

  const [showHeaderMenu, setShowHeaderMenu] = React.useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const emojiPickerRef = useRef();

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

  // Handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if(!file || !file.type.startsWith('image/')){
      toast.error('Please select a valid image file');
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({image: reader.result});
      e.target.value = "";
    }
    reader.readAsDataURL(file);
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

  // Close header menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHeaderMenu && headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
      // Close emoji picker when clicking outside
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeaderMenu, showEmojiPicker]);
  
  return selectedUser ?  (
      <div className='h-full overflow-scroll relative' style={{ backgroundImage: `url(${assets.chatBg})`, backgroundSize: 'cover' }}> {/* add image.png in background for ChatContainer */}
      {/* ---------- Header -------------- */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500 relative'>
        <img src={selectedUser?.profilePicture || assets.avatar_icon} alt="User Profile Pic" className='w-8 rounded-full'/>
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser?.fullName || selectedUser?.fullname || 'Unknown'}
          {((onlineUsers || []).includes(selectedUser._id)) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </p>
        <div className='flex items-center gap-3' ref={headerMenuRef}>
          <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
          <img 
            onClick={() => setShowHeaderMenu(prev => !prev)} 
            src={assets.menu_icon} 
            alt="Menu" 
            className='max-w-6 cursor-pointer'
          />
          {/* Header Dropdown Menu */}
          {showHeaderMenu && (
            <div className='absolute top-14 right-4 bg-gray-800 rounded-lg shadow-lg py-1 z-10 min-w-[150px]'>
              <button
                onClick={() => {
                  setRightSidebarOpen(prev => !prev);
                  setShowHeaderMenu(false);
                }}
                className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700'
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
                className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700'
              >
                <span className='w-4 h-4 flex items-center justify-center text-base'>🗑️</span>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {/* ---------- chat area ------------ */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {/* {messages.filter(Boolean).map((msg, index)=> (
          <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            {msg.image ? (
              <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
            ) : (
              <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId !== authUser._id ? 'rounded-bg-none' : 'rounded-bl-none'}`}>{msg.text}</p>
            )}
            <div className='text-center text-xs'>
              <img src={msg.senderId === authUser._id ? authUser?.profilePicture || assets.avatar_icon : selectedUser?.profilePicture || assets.avatar_icon} alt="" className='w-7 rounded-full' />
              <p className='text-gray-500'>{formateMessageTime(msg.createdAt)}</p> */}
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
              ) : (
                <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${!isSender ? 'rounded-bg-none' : 'rounded-bl-none'}`}>{msg.text}</p>
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
                <div className={`absolute top-6 bg-gray-800 rounded-lg shadow-lg py-1 z-10 ${isSender ? 'right-0' : 'left-0'}`}>
                  <button
                    onClick={() => handleDeleteForMe(msg._id)}
                    className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 whitespace-nowrap'
                  >
                    Delete for me
                  </button>
                  {isSender && (
                    <button
                      onClick={() => handleDeleteForEveryone(msg._id)}
                      className='block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 whitespace-nowrap'
                    >
                      Delete for everyone
                    </button>
                  )}
                </div>
              )}
              
              <div className='text-center text-xs'>
                <img src={isSender ? authUser?.profilePicture || assets.avatar_icon : selectedUser?.profilePicture || assets.avatar_icon} alt="" className='w-7 rounded-full' />
                <p className='text-gray-500'>{formateMessageTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>
      {/* --------- bottom area --------- */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full relative'>
          <input onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e)=> e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder='Sent a message...' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'/>
          
          {/* Emoji Picker */}
          <div ref={emojiPickerRef} className='relative'>
            <button 
              onClick={() => setShowEmojiPicker(prev => !prev)} 
              className='text-xl mr-2 cursor-pointer hover:scale-110 transition-transform'
              type="button"
            >
              😊
            </button>
            {showEmojiPicker && (
              <div className='absolute bottom-12 right-0 z-20'>
                <EmojiPicker 
                  onEmojiClick={handleEmojiClick} 
                  theme="dark"
                  width={300}
                  height={400}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
          </div>
          
          <input onChange={handleSendImage} type="file" id="image" accept='image/png, image/jpeg' hidden />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' /> 
          </label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer'/>
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img onClick={handleSendMessage} src={assets.logo_icon} alt=""  className='max-w-16' />
      <p className='text-lg font-medium text-white'>JUST KANVA IT...</p>
    </div>
  )
}

export default ChatContainer;