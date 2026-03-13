import React from 'react';
import assets from '../assets/assets';
import { chatContext } from '../context/chatContext.jsx';
import { authContext } from '../context/authContext.jsx';
import { useEffect } from 'react';

const RightSideBar = () => {

  const {selectedUser, messages} = React.useContext(chatContext);
  const {logout, onlineUsers} = React.useContext(authContext);
  const [msgImages, setMsgImages] = React.useState([]);

  // Get all the images from messages and set them to state
  useEffect(() => {
    setMsgImages(
      messages.filter(msg => msg.image).map(msg => msg.image)
    )
  }, [messages]);

  return selectedUser ? (
    <div
      className='theme-panel relative h-full p-5 rounded-l-xl'
      style={{ background: 'var(--theme-sidebar-bg)', color: 'var(--theme-text-primary)' }}
    >
      {/* ------profile info----------- */}
      <div className='flex flex-col items-center gap-4'>
        <img src={selectedUser?.profilePicture || assets.avatar_icon} alt="" className='w-20 aspect-[1/1] rounded-full' />
        <div className='text-center'>
          <h1 className='text-xl font-medium flex items-center justify-center gap-2'>
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id) && <p className='w-2 h-2 rounded-full bg-green-500'></p>}
          </h1>
          <p className='mt-2' style={{ color: 'var(--theme-text-secondary)' }}>{selectedUser.bio}</p>
        </div>
      </div>
      <hr className='my-4' style={{ borderColor: 'var(--theme-border)' }} />
      {/* ------------media----------- */}
      <div className='px-5 text-xs'>
        <p style={{ color: 'var(--theme-text-secondary)' }}>Media</p>
        <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>
          {msgImages.map((url, index)=> (
            <div key={index} onClick={()=> window.open(url)} className='cursor-pointer rounded'>
              <img src={url} alt="" className='h-full rounded-md' />
            </div>
          ))}
        </div>
      </div>
      {/* ---------logout---------- */}
      <button onClick={()=> logout()} className='absolute bottom-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white text-sm font-light py-2 px-20 rounded-full cursor-pointer'>
        Logout
      </button>
    </div>
  ) : null
}

export default RightSideBar;
