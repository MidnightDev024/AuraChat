import { createContext, useContext, useState, useEffect } from "react";
import { authContext } from "./authContext.jsx";
import toast from "react-hot-toast";

export const chatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

    const { socket, axios } = useContext(authContext);

    // function to get all users from sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to send message to selected user
    const sendMessage = async (messageData) => {
        try {
            if (!selectedUser) {
                toast.error('No user selected');
                return;
            }
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                // server returns the created message as `newMessage`
                const msg = data.newMessage || data.message;
                setMessages((prevMessages) => [...prevMessages, msg]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // clear messages in the current conversation (frontend state)
    const clearMessages = () => setMessages([]);

    // remove single message from state
    const removeMessage = (id) => setMessages(prev => prev.filter(m => m._id !== id));

    // update single message in state
    const updateMessage = (id, newFields) => setMessages(prev => prev.map(m => m._id === id ? {...m, ...newFields} : m));

    // function to subscribe to message for selected user
    const subscribeToMessages = () => {
        if (!socket) return;
        socket.on("newMessage", (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })

        socket.on('messageDeleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });

        socket.on('messageUpdated', (updatedMessage) => {
            setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
        });
    };

    // function to unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
            socket.off("messageDeleted");
            socket.off("messageUpdated");
        }
    };

    useEffect(() => {
        subscribeToMessages();
        return () => {
            unsubscribeFromMessages();
        };
    }, [socket, selectedUser]);

    // const value = {
        // messages,
        // users,
        // selectedUser,
        // getUsers,
        // getMessages,
        // sendMessage,
        // setSelectedUser,
        // unseenMessages,
        // setUnseenMessages
    // }

    // return (<chatContext.Provider value={value}>
    //     {children}
    // </chatContext.Provider>);
return (
        <chatContext.Provider value={{
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        clearMessages,
        rightSidebarOpen,
        setRightSidebarOpen,
        removeMessage,
        updateMessage
        }}>
            {children}
        </chatContext.Provider>
    );
}