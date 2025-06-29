import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AdvisoryCard = ({ member, isExpanded, onToggle }) => {
  return (
    // The `layout` prop from framer-motion will automatically animate size changes
    <motion.div
      layout
      onClick={onToggle}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-200 shadow-lg cursor-pointer overflow-hidden"
      initial={{ borderRadius: "0.75rem" }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
    >
      <div className="flex flex-col items-center text-center">
        <motion.img
          layout="position"
          className="mx-auto h-24 w-24 rounded-full mb-4 object-cover shadow-md"
          src={member.imageUrl}
          alt={member.name}
        />
        <motion.h3 layout="position" className="text-lg font-bold text-slate-900">{member.name}</motion.h3>
        <motion.p layout="position" className="font-sans font-semibold text-blue-600 mb-3 text-sm">{member.title}</motion.p>
        
        {/* AnimatePresence will handle the smooth appearance and disappearance of the bio */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="font-sans text-slate-600 text-sm mt-2 w-full text-left"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', transition: { delay: 0.1, duration: 0.3 } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
            >
              <p>{member.bio}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AdvisoryCard;
