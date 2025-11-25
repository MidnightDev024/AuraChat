import React from 'react';
import Picker from 'emoji-picker-react';

const EmojiPicker = ({ onEmojiClick, onClose }) => {
  return (
    <div className='absolute bottom-16 left-0 z-50'>
      <div 
        className='fixed inset-0' 
        onClick={onClose}
      />
      <div className='relative'>
        <Picker 
          onEmojiClick={(emojiData) => {
            onEmojiClick(emojiData.emoji);
          }}
          width={300}
          height={400}
          theme="dark"
          searchPlaceholder="Search emoji..."
          previewConfig={{ showPreview: false }}
        />
      </div>
    </div>
  );
};

export default EmojiPicker;
