import { createContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendURL;

export const authContext = createContext();

// Helper function to convert URL-safe base64 to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    
    // Ref to track the actual socket instance for connection checks
    const socketRef = useRef(null);

    // Register service worker and subscribe to push notifications
    const registerPushNotifications = async () => {
        // Check if service workers and push are supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return;
        }

        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered');

            // Get VAPID public key from server
            let keyData;
            try {
                const response = await axios.get('/api/auth/vapid-key');
                keyData = response.data;
            } catch (keyError) {
                console.log('Failed to fetch VAPID key:', keyError.message);
                return;
            }
            
            if (!keyData.success || !keyData.publicKey) {
                console.log('VAPID key not available');
                return;
            }

            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return;
            }

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
            });

            // Send subscription to server
            try {
                const saveResponse = await axios.post('/api/auth/push-subscription', { subscription });
                if (saveResponse.data.success) {
                    console.log('Push notification subscription saved');
                } else {
                    console.log('Failed to save push subscription:', saveResponse.data.message);
                }
            } catch (saveError) {
                console.log('Failed to save push subscription:', saveError.message);
            }
        } catch (error) {
            console.error('Error setting up push notifications:', error);
        }
    };

    // check if user is authentcated and if so,set the user data and connect the socket 
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
                // Register push notifications after authentication
                registerPushNotifications();
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    }

    // Login function to handle user authentication and socket connection

    const login = async (state, Credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, Credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData); 
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token); 
                toast.success(data.message);
                // Register push notifications after login
                registerPushNotifications();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    }

    // Logout function to handle user logout and socket disconnection

    const logout = async () => {
        // Remove push subscription from server
        try {
            await axios.delete('/api/auth/push-subscription');
        } catch (error) {
            console.log('Error removing push subscription:', error.message);
        }
        
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully");
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocket(null);
    }

    // Update profile function to update user data

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/updateProfile", body);
            if (data.success) {
                // Update local auth user immediately
                setAuthUser(data.userData);
                toast.success("Profile updated successfully");

                // Ensure we have the freshest user data from the server
                try {
                    const refreshed = await axios.get("/api/auth/check");
                    if (refreshed.data?.success) {
                        setAuthUser(refreshed.data.user);
                    }
                } catch (err) {
                    // Non-fatal; we already updated local state
                    console.warn('Could not refresh auth user after profile update', err?.message || err);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }   
    }

    // connect socket function to handle socket connection and online users update
    const connectSocket = (userData) => {
        if(!userData) return;
        // Use ref to check connection status to avoid stale closure
        if(socketRef.current?.connected) return;
        
        const newSocket = io(backendURL, {
            query: { 
                userId: userData._id 
            }
        });
        newSocket.connect();
        socketRef.current = newSocket;
        setSocket(newSocket);
        
        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });
    }

    useEffect(() => {
        if (token){
            axios.defaults.headers.common["token"] = token;
        }
        checkAuth();
    }, []);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        setAuthUser,
        setToken,
        token
    }

    return(
        <authContext.Provider value={value}>
            {children}
        </authContext.Provider>
    )
}