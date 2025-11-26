// Get all users except the logged in user
import User from "../models/user.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import {io, userSocketMap} from "../server.js";
import { sendPushNotification } from "../lib/webPush.js";

export const getUsersForSidebar = async (req, res)=> {
    try {
        const userId = req.user._id
        const filteredUser = await User.find({ _id: { $ne: userId } }).select("-password");
        
        // count number of messages not seen from each user
        const unseenMessages = {}
        const promises = filteredUser.map(async (user) => {
            const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false})
            if(messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        }) 
        await Promise.all(promises);
        res.json({success: true, users: filteredUser, unseenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// get all messages for selected user
export const getMessages = async (req, res) => {
    try { 
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId}
            ],
            deletedFor: { $ne: myId } // Exclude messages deleted for the logged-in user
        });
        await Message.updateMany({senderId: selectedUserId, receiverId: myId}, {seen: true})

        res.json({success: true, messages})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// api to mark messages as seen using message ids
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { messageIds } = req.body;
        await Message.updateMany(_id, {seen: true});
        res.json({success: true});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
} 

// send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageURL;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageURL = uploadResponse.secure_url;
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageURL
        })

        // emit the message to receiver if online
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        } else {
            // User is offline, send push notification if they have a subscription
            const receiver = await User.findById(receiverId);
            if (receiver?.pushSubscription) {
                const sender = await User.findById(senderId);
                const senderName = sender?.fullname || "Someone";
                const notificationBody = image ? "Sent an image" : (text || "New message received");
                
                try {
                    await sendPushNotification(receiver.pushSubscription, {
                        title: senderName,
                        body: notificationBody,
                        icon: '/logo_icon.svg',
                        data: {
                            senderId: senderId.toString(),
                            messageId: newMessage._id.toString()
                        }
                    });
                } catch (pushError) {
                    // If subscription is expired, remove it
                    if (pushError.message === 'SUBSCRIPTION_EXPIRED') {
                        await User.findByIdAndUpdate(receiverId, {pushSubscription: null});
                    }
                    console.log('Push notification failed:', pushError.message);
                }
            }
        }

        res.json({success: true, newMessage});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// delete all messages between logged-in user and selected user
export const deleteConversation = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        await Message.deleteMany({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        });

        return res.json({ success: true, message: 'Conversation deleted' });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
}

// delete message for current user (mark as deleted for them)
export const deleteMessageForMe = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.json({ success: false, message: 'Message not found' });
        }

        // Add user to deletedFor array using $addToSet for atomic operation
        const result = await Message.findByIdAndUpdate(
            messageId,
            { $addToSet: { deletedFor: userId } },
            { new: true }
        );

        if (!result) {
            return res.json({ success: false, message: 'Failed to update message' });
        }

        // If both users have deleted it, physically delete it
        const otherUserId = message.senderId.toString() === userId.toString() 
            ? message.receiverId 
            : message.senderId;
        
        const bothDeleted = result.deletedFor.some(id => id.toString() === otherUserId.toString());
        
        if (bothDeleted && result.deletedFor.length >= 2) {
            try {
                await Message.findByIdAndDelete(messageId);
            } catch (deleteError) {
                // If deletion fails (e.g., already deleted), just log and continue
                console.log('Message may have already been deleted:', deleteError.message);
            }
        }

        return res.json({ success: true, message: 'Message deleted for you' });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
}

// delete message for everyone (only sender can do this)
export const deleteMessageForEveryone = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.json({ success: false, message: 'Message not found' });
        }

        // Only sender can delete for everyone
        if (message.senderId.toString() !== userId.toString()) {
            return res.json({ success: false, message: 'Only sender can delete for everyone' });
        }

        await Message.findByIdAndDelete(messageId);

        // Emit socket event to notify both sender and receiver
        const receiverSocketId = userSocketMap[message.receiverId.toString()];
        const senderSocketId = userSocketMap[message.senderId.toString()];
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", { messageId });
        }
        
        // Also notify sender's other sessions/devices
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageDeleted", { messageId });
        }

        return res.json({ success: true, message: 'Message deleted for everyone' });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
}