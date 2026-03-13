import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-4 h-full max-md:hidden bg-white/5"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="p-4 rounded-full bg-indigo-500/20 border border-indigo-400/30"
      >
        <MessageSquare className="w-10 h-10 text-indigo-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-center"
      >
        <h2 className="text-lg font-semibold text-white/80 mb-1">
          Welcome to AuraChat
        </h2>
        <p className="text-sm text-gray-400">
          Select a conversation to start chatting
        </p>
      </motion.div>
    </motion.div>
  );
};

export default NoChatSelected;
