import React, { useContext, useEffect } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { authContext } from '../context/authContext.jsx';
import { chatContext } from '../context/chatContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import SidebarSkeleton from './skeletons/SidebarSkeleton.jsx';
import { useThemeStore } from '../store/useThemeStore.js';

const Sidebar = () => {

  const {getUsers, users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages, isLoadingUsers} = useContext(chatContext);

  const { logout, onlineUsers } = useContext(authContext);
  const { theme } = useThemeStore();

  const [input, setInput] = React.useState('');
  const navigate = useNavigate();

  // menu open state for click-toggle menu
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  const filteredUsers = input
          ? users.filter((user) => ((user?.fullName || user?.fullname || '').toLowerCase().includes((input || '').toLowerCase())))
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers])

  // close menu when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const isLight = theme === "light";

  if (isLoadingUsers) {
    return (
      <div className={`${selectedUser ? 'max-md:hidden' : ''}`}>
        <SidebarSkeleton />
      </div>
    );
  }

  return (
    <div
      className={`theme-panel h-full p-5 rounded-r-xl overflow-y-scroll ${selectedUser ? "max-md:hidden" : ''}`}
      style={{ background: 'var(--theme-sidebar-bg)' }}
    >
      <div className='pb-5'>
        <div className='flex justify-between items-center'>
          <img src={assets.logo} alt="Logo" className='max-w-40' />
          <div className='flex items-center gap-2'>
            <ThemeToggle />
            <div className='relative py-2' ref={menuRef}>
              <img
                onClick={() => setMenuOpen(prev => !prev)}
                src={assets.menu_icon}
                alt="Menu Icon"
                className={`max-h-5 cursor-pointer ${isLight ? 'opacity-70' : ''}`}
              />
              <div
                className={`absolute top-full right-0 z-20 w-32 p-5 rounded-md border text-xs ${menuOpen ? 'block' : 'hidden'}`}
                style={{
                  background: 'var(--theme-dropdown-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              >
                <p onClick={() => { setMenuOpen(false); navigate('/profile'); }} className='cursor-pointer text-sm'>Edit Profile</p>
                <hr className='my-2' style={{ borderColor: 'var(--theme-border)' }} />
                <p onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }} className='cursor-pointer text-sm'>Logout</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className='theme-input rounded-full flex items-center gap-2 py-3 px-4 mt-0'
          style={{ background: isLight ? 'rgba(0,0,0,0.08)' : '#282142' }}
        >
          <img src={assets.search_icon} alt="search" className={`w-3 ${isLight ? 'opacity-50' : ''}`} />
          <input
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className='bg-transparent border-none outline-none text-xs flex-1'
            style={{ color: 'var(--theme-text-primary)' }}
            placeholder='Search User...'
          />
        </div>

        <div className='flex flex-col mt-7'>
          {filteredUsers.map((user, index) => (
            <div
              onClick={() => { setSelectedUser(user); setUnseenMessages(prev => ({ ...prev, [user._id]: 0 })) }}
              key={index}
              className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm transition-colors ${selectedUser?._id === user._id ? (isLight ? 'bg-indigo-100' : 'bg-[#282142]/50') : ''}`}
              style={{ color: 'var(--theme-text-primary)' }}
            >
              <img src={user?.profilePicture || assets.avatar_icon} alt="profilePic" className='w-[35px] aspect-[1/1] rounded-full' />
              <div className='flex flex-col leading-5'>
                <p>{user?.fullName || user?.fullname || 'Unknown'}</p>
                {
                  ((onlineUsers || []).includes(user._id))
                  ? <span className='text-green-400 text-xs'>Online</span>
                  : <span className='text-xs' style={{ color: 'var(--theme-text-secondary)' }}>Offline</span>
                }
              </div>
              {
                (unseenMessages?.[user._id] > 0) && (
                  <p
                    className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full text-white'
                    style={{ background: 'var(--theme-badge-bg)' }}
                  >
                    {unseenMessages[user._id]}
                  </p>
                )
              }
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default Sidebar;